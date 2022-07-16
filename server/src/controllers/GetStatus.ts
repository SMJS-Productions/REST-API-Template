import { Status } from "std-node";
import { RequestMethod } from "../enums/RequestMethod";
import { Controller } from "../templates/Controller";
import { request } from "../types/request";
import { response } from "../types/response";

export class GetStatus extends Controller {

    constructor() {
        super("/status", RequestMethod.GET);
    }

    protected async request(_: request, response: response): Promise<void> {
        Controller.respond(response, Status.OK);
    }
}