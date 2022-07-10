import express from "express";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { BetterArray, DevConsole, DynamicObject, Status } from "std-node";
import { Conflict } from "./enums/Conflict";
import { Controller } from "./templates/Controller";
import { Config } from "./utils/Config";
import { Docsify } from "./utils/Docsify";

export const APP = express();
export const SETTINGS = new Config<Settings>(join(__dirname, "../../settings.json"));
export const LISTENER = APP.listen(SETTINGS.get("web").port ?? 8080, () => {
    const controllers: DynamicObject<Controller[]> = {};
    const controllerPath = join(__dirname, "controllers");
    const address = LISTENER.address() || "localhost:8080";

    APP.disable("x-powered-by");
    APP.use(express.json({
        limit: SETTINGS.get("web").max_packet_size
    }));

    DevConsole.info(
        `API listening on \x1b[34m%s\x1b[0m`, 
        typeof address == "string" ? address : `${address.address}:${address.port}`
    );

    BetterArray.from(readdirSync(controllerPath)).asyncForEach(async (file) => {
        const path = join(controllerPath, file);

        if (statSync(path).isFile() && /\.[tj]s/.test(file)) {
            const controller: Controller = new ((await import(path))[file.slice(0, -3)])();

            if (controller.category in controllers) {
                controllers[controller.category].push(controller);
            } else {
                controllers[controller.category] = [ controller ];
            }
        }
    }).then(() => {
        const docsPath = join(__dirname, "../../docs");
        const mdPagesPath = join(docsPath, "/md");
        const staticPath = join(docsPath, "/static");

        mkdirSync(mdPagesPath, { recursive: true });

        writeFileSync(
            join(staticPath, "/index.html"), 
            readFileSync(join(docsPath, "/templates/index.html"), "utf8").replace(
                /(?<=<body>)(?=<\/body>)/,
                Object.entries(controllers).reduce((target, [ category, controllers ]) => {
                    const md = new Docsify(category, controllers).markdown;
        
                    writeFileSync(join(mdPagesPath, `${category.replace(/\s/g, "_").toLowerCase()}.md`), md);
        
                    return target += `<div class="page">\n${md}\n</div>`;
                }, "")
            )
        );

        APP.use(express.static(staticPath));
        APP.use((request, response) => {
            DevConsole.warn(
                "A user requested the unknown page \x1b[31m%s\x1b[0m using the \x1b[31m%s\x1b[0m method", 
                request.url,
                request.method
            );

            Controller.respond(response, Status.NOT_FOUND, Conflict.NOT_FOUND);
        });

        DevConsole.info("Registered \x1b[34m%s\x1b[0m as \x1b[34m%s\x1b[0m", "./", "ALL");
        DevConsole.info("Registered default fallback response");
    });
});