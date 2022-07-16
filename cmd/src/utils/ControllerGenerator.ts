import { Endpoint } from "../types/schema";

export class ControllerGenerator {

    public readonly code: string;

    constructor(className: string, endpoint: Endpoint) {
        // TODO: Make interfaces & stuff based on the schema
        this.code = [
            "import { Status } from \"std-node\";",
            "import { Controller } from \"../templates/Controller\";",
            "import { RequestMethod } from \"../enums/RequestMethod\";",
            "import { request } from \"../types/request\";",
            "import { response } from \"../types/response\";",
            "import { next } from \"../types/next\";",
            "",
            `export class ${className} extends Controller {`,
            "",
            "\tconstructor() {",
            `\t\tsuper("${endpoint.path}", RequestMethod.${endpoint.method}${
                endpoint.version ? `, ${endpoint.version}` : ""
            });`,
            "\t}",
            "",
            "\tprotected async request(request: request, response: response, next: next): Promise<void> {",
            "\t\tController.respond(response, Status.NOT_IMPLEMENTED);",
            "\t}",
            "}",
            ""
        ].join("\n");
    }
}