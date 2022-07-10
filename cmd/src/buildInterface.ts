#!/usr/bin/env node

import { readFile } from "fs";
import { join } from "path";
import { cwd } from "process";
import yargs from "yargs";

// Node, of all the things you decided to not copy from standard js, why the standardized async
new Promise(async (resolve, reject) => {
    const options = await yargs.usage("Usage: $0 -p <path> -n <name> -i [indent]").option("p", {
        alias: "path",
        describe: "Path to the JSON file to interface",
        type: "string",
        demandOption: true
    }).option("n", {
        alias: "name",
        describe: "Name of the interface",
        type: "string",
        demandOption: true
    }).option("i", {
        alias: "ident",
        describe: "The indent size of the output",
        type: "number",
        default: 4
    }).argv;

    readFile(join(cwd(), options.p), "utf8", (error, json) => {
        if (error) {
            reject("This file does not exist");
        } else {
            try {
                resolve(`interface ${options.n} ${
                    JSON.stringify(recursiveTypeParser(JSON.parse(json)), null, options.i).replace(
                        /"[a-z]\w+"|(?<=:\s*)".+?"/gi,
                        (capture) => capture.slice(1, -1)
                    )
                }`);
            } catch(error) {
                reject("Invalid JSON");
            }
        }
    })
}).then(console.log).catch(console.error);

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