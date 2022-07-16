#!/usr/bin/env node

import { readFile } from "fs";
import { join } from "path";
import { cwd } from "process";
import yargs from "yargs";

yargs.scriptName("interfacer").command({
    command: "$0",
    describe: "",
    builder: (yargs) => yargs.option("path", {
        alias: "p",
        describe: "The path to the JSON file to interface",
        type: "string",
        demandOption: true
    }).option("name", {
        alias: "n",
        describe: "Name of the interface",
        type: "string",
        demandOption: true
    }).option("indent", {
        alias: "i",
        describe: "The indent size of the output",
        type: "number",
        default: 4
    }).option("export", {
        alias: "e",
        describe: "If the interface should be exported",
        type: "boolean",
        default: undefined
    }).usage("$0 -p <path> -n <name> -i [indent] -e [export]"),
    handler: (args) => readFile(join(cwd(), args.path), "utf8", (error, json) => {
        if (error) {
            console.error("This file does not exist");
        } else {
            try {
                console.info(`${args.export == undefined ? "" : "export "}interface ${args.name} ${
                    JSON.stringify(recursiveTypeParser(JSON.parse(json)), null, args.indent).replace(
                        /"[a-z]\w+"|(?<=:\s*)".+?"/gi,
                        (capture) => capture.slice(1, -1)
                    )
                }`);
            } catch(error) {
                console.error("Invalid JSON");
            }
        }
    })
}).argv;

function recursiveTypeParser(data: object): object {
    return Object.fromEntries(Object.entries(data).map(([ key, value ]) => {
        if (Array.isArray(value)) {
            value = `(${value.map(recursiveTypeParser).filter(
                // TODO: Design a system which can compare objects
                (object, index, array) => array.findIndex((arrayObject) => typeof object == typeof arrayObject) == index
            ).join(" | ")})[]`;
        } else if (typeof value == "object") {
            value = recursiveTypeParser(value);
        } else {
            value = typeof value;
        }

        return [ key, value ];
    }));
}