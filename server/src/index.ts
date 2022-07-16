import express from "express";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { BetterArray, DevConsole, DynamicObject, Status } from "std-node";
import { Conflict } from "./enums/Conflict";
import { Settings } from "./interfaces/Settings";
import { Controller } from "./templates/Controller";
import { Config } from "./utils/Config";

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
        APP.use(express.static(join(__dirname, "../../docs", "/static")));
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