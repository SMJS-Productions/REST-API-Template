#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import yargs from "yargs";
import Ajv from "ajv";
import { APISchema, Endpoint } from "./types/schema";
import { Docsify } from "./utils/Docsify";
import { ControllerGenerator } from "./utils/ControllerGenerator";

const workingDir = cwd();

yargs.scriptName("api-template").command({
    command: "document",
    describe: "Generate documentations from the API structure",
    builder: (yargs) => yargs.option("structure", {
        alias: "s",
        describe: "The path to the API structure which uses a JSON template",
        type: "string",
        demandOption: true
    }).option("output", {
        alias: "o",
        describe: "The path to the output documentations output path, the file name will be the same as the template",
        type: "string",
        demandOption: true
    }).option("template", {
        alias: "t",
        describe: "The path to the template HTML file for the documentations",
        type: "string",
        demandOption: true
    }).option("pattern", {
        alias: "p",
        describe: "The Regex pattern indicating where in the HTML template the documentation should be inserted",
        type: "string",
        default: "(?<=<body>)(?=<\\/body>)"
    }).option("verbose", {
        alias: "v",
        describe: "If the Markdown result of the documentations should be saved in their own files",
        type: "boolean",
        default: undefined
    }).usage("$0 document -s <structure> -o <output> -t <template> -p [pattern] -v [verbose]"),
    handler: (args) => {
        const structure = getStructure(args.structure);
        const output = join(workingDir, args.output);
        const mdOutput = join(output, "/md");
        const sortedEndpoints: { [key: string]: Endpoint[] } = {};

        if (typeof structure === "string") {
            console.error(structure);
        } else {
            structure.endpoints.map((endpoint) => [
                /\/(.+?)(?:\/)?(?::|$)/.exec(endpoint.path)?.[1].replace(/\//g, " ").toUpperCase(),
                endpoint
            ]).filter(([ key ]) => key).forEach(([ key, endpoint ]) => sortedEndpoints[<string>key] ?
                sortedEndpoints[<string>key].push(<Endpoint>endpoint) :
                sortedEndpoints[<string>key] = [ <Endpoint>endpoint ]
            );
            mkdirSync(args.verbose ? mdOutput : output, { recursive: true });

            try {
                writeFileSync(
                    join(workingDir, args.output, <string>args.template.split(/[\\\/]/).pop()),
                    readFileSync(join(workingDir, args.template), "utf8").replace(
                        new RegExp(args.pattern, "g"),
                        Object.entries(sortedEndpoints).reduce((target, [ key, endpoints ]) => {
                            const md = new Docsify(key, endpoints).markdown;

                            if (args.verbose) {
                                writeFileSync(join(mdOutput, `${key.replace(/\s/g, "_").toLowerCase()}.md`), md);
                            }

                            return target += `<div class="page">\n${md}\n</div>`;
                        }, "")
                    )
                );

                console.info(`Documentations generated in ${output}`);
            } catch(error) {
                console.error("Couldn't write to the specified output path");
            }
        }
    }
}).command({
    command: "code",
    describe: "Generate the code templates from the API structure",
    builder: (yargs) => yargs.option("structure", {
        alias: "s",
        describe: "The path to the API structure which uses a JSON template",
        type: "string",
        demandOption: true
    }).option("project", {
        alias: "p",
        describe: "The path to the project directory",
        type: "string",
        demandOption: true
    }).usage("$0 code -s <structure> -p <project>"),
    handler: (args) => {
        const project = join(workingDir, args.project);
        const controllers = join(project, "controllers");
        const structure = getStructure(args.structure);

        if (typeof structure === "string") {
            console.error(structure);
        } else if (existsSync(join(project, "templates/Controller.ts"))) {
            mkdirSync(controllers, { recursive: true });

            structure.endpoints.forEach((endpoint) => {
                const name = endpoint.method.charAt(0) +
                    endpoint.method.slice(1).toLowerCase() +
                    /(\/.+?)(?:\/)?(?::|$)/.exec(endpoint.path)?.[1].replace(
                        /\/./g, 
                        (match) => match.slice(1).toUpperCase()
                    );
                const file = join(controllers, `${name}.ts`);

                if (!existsSync(file)) {
                    writeFileSync(
                        join(controllers, `${name}.ts`),
                        new ControllerGenerator(name, endpoint).code
                    );
                }
            });

            console.info("Generated");
        } else {
            console.error("Invalid target project");
        }
    }
// Literally who decided that argv HAS to be called to process the command line arguments????
}).demandCommand().help("help").alias("help", "h").argv;

function getStructure(structure: string): APISchema | string {
    const path = join(workingDir, structure);

    if (existsSync(path)) {
        try {
            const structure: APISchema = JSON.parse(readFileSync(path, "utf8"));

            if (new Ajv({ strict: false }).compile(
                JSON.parse(readFileSync(join(__dirname, "../../schemas/api.schema.json"), "utf8"))
            )(structure)) {
                return structure;
            } else {
                return "The JSON structure does not match the API schema";
            }
        } catch(error) {
            return "Invalid JSON";
        }
    } else {
        return "This file does not exist";
    }
}