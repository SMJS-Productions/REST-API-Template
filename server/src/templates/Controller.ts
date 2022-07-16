import { DevConsole, Status } from "std-node";
import { next } from "../types/next";
import { request } from "../types/request";
import { response } from "../types/response";
import { RequestMethod } from "../enums/RequestMethod";
import { APP, SETTINGS } from "..";

/**
 * A template which handles the API controller registration
 */
export abstract class Controller {

    /**
     * A method which constructs a standard response object
     * @param response The response object provided by express
     * @param status The response status code
     * @param message The response message/object
     */
    public static respond<T>(response: response, status: Status, message?: T): void {
        response.status(status).json({ status, message }).end();
    }

    public readonly category: string;

    public readonly path: string;
    
    public readonly method: string;

    public readonly version: number;

    /**
     * Registers a simple API endpoint
     * @param path The url path
     * @param method The request method
     * @param version The API version if it's different from the one set in the settings
     */
    constructor(
        path: string,
        method: RequestMethod,
        version: number = SETTINGS.get("api").version
    ) {
        this.category = /^(?:\/)?(.+?)(?:\/)?(?::|$)/.exec(path)?.[1].replace(/\//g, " ").replace(
            /(?<=^|\s)\w/g,
            (match) => match.toUpperCase()
        ) ?? "Unknown";
        this.path = `/api/v${version}/${path.startsWith("/") ? path.slice(1) : path}`;
        this.method = RequestMethod[method];
        this.version = version;

        // Uses request method as a key for the express instance to register the endpoint under the right method
        APP[<keyof typeof APP >this.method.toLowerCase()](path, (
            request: request, 
            response: response, 
            next: next
        ) => {
            DevConsole.info("Invoking a request for \x1b[34m%s\x1b[0m using the \x1b[34m%s\x1b[0m method", path, this.method);

            this.request(request, response, next).catch(DevConsole.error)
        });
        
        DevConsole.info("Registered \x1b[34m%s\x1b[0m as \x1b[34m%s\x1b[0m", path, RequestMethod[method]);
    }

    /**
     * An abstract method which will be called when the provided path is called
     * @param request The request object provided by express
     * @param response The response object provided by express
     * @param next The next callback provided by express
     */
    protected abstract request(request: request, response: response, next: next): Promise<void>;
}