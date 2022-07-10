import { DevConsole, Status } from "std-node";
import { next } from "../types/next";
import { request } from "../types/request";
import { response } from "../types/response";
import { RequestMethod } from "../enums/RequestMethod";
import { APP, SETTINGS } from "..";
import { DefinitionType } from "../types/definitions/DefinitionType";
import { DefinitionObject } from "../interfaces/definitions/DefinitionObject";

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

    /**
     * A method which determines falls under the authorization requirements
     * @param method The request method used by the endpoint
     * @param path The url path used by the endpoint
     * @returns If the endpoint falls under the authorization requirements
     */
    public static isAuthorized(method: string, path: string) {
        return method != "GET" && /^(?:\/)?api\/v[0-9]+\/submission$/.test(path);
    }

    public readonly category: string;

    public readonly path: string;
    
    public readonly method: string;

    public readonly version: number;

    public readonly authorized: boolean;
    
    public readonly description: string;
    
    public returnBodyDefinition?: DefinitionType;

    public urlParamsDefinition?: Record<string, string>

    public postBodyDefinition?: DefinitionType;
    
    public urlQueryDefinition?: Record<string, string>;

    public headerDefinition?: Record<string, string>;

    public definitions?: DefinitionObject[];

    /**
     * Registers a simple API endpoint
     * @param path The url path
     * @param method The request method
     * @param version The API version if it's different from the one set in the settings
     */
    constructor(
        path: string,
        method: RequestMethod,
        description: string,
        version: number = SETTINGS.get("api").version
    ) {
        this.category = /^(?:\/)?(.+?)(?:\/)?(?::|$)/.exec(path)?.[1].replace(/\//g, " ").replace(
            /(?<=^|\s)\w/g,
            (match) => match.toUpperCase()
        ) ?? "Unknown";
        this.path = `/api/v${version}/${path.startsWith("/") ? path.slice(1) : path}`;
        this.method = RequestMethod[method];
        this.version = version;
        this.authorized = Controller.isAuthorized(this.method, this.path);
        this.description = description;


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

    protected setReturnBodyDefinition(definition: DefinitionType): void {
        this.returnBodyDefinition = definition;
    }

    protected setUrlParamsDefinition(definition: Record<string, string>): void {
        this.urlParamsDefinition = definition;
    }

    protected setPostBodyDefinition(definition: DefinitionType): void {
        this.postBodyDefinition = definition;
    }

    protected setUrlQueryDefinition(definition: Record<string, string>): void {
        this.urlQueryDefinition = definition;
    }

    protected setHeaderDefinition(definition: Record<string, string>): void {
        this.headerDefinition = definition;
    }

    protected setDefinitions(definitions: DefinitionObject[]): void {
        this.definitions = definitions;
    }
}