import { DocumentationInfo } from "../interfaces/DocumentationInfo";
import { definition } from "../types/definition";
import { Endpoint, EnumField, ObjectDefinition, TypeDefinition } from "../types/schema";

export class Docsify {

    public static partialize(type: definition): definition {
        // Not only does this dereference the first layer, but also all following layers
        const newType: definition = JSON.parse(JSON.stringify(type));

        if (Array.isArray(newType)) {
            newType[0].partial = true;
        } else {
            "$info" in newType ? newType.$info.partial = true : newType.partial = true;
        }

        return newType;
    }

    private static readonly METHOD_COLORS = {
        GET: "#988ED4",
        DELETE: "#B95B59",
        PATCH: "#CEB61F",
        POST: "#8FC860",
        PUT: "#E39530"
    };

    public readonly markdown: string;

    private readonly enums: DocumentationInfo[] = [];

    private readonly definitions: DocumentationInfo[];
    
    constructor(category: string, endpoints: Endpoint[]) {
        this.definitions = [];

        endpoints.forEach(
            ({ definitions }) => definitions?.forEach((definition) => this.recursiveConstructor(definition))
        );

        this.markdown = [
            `# ${category}`,
            ...endpoints.map((endpoint) => {
                const markdown = [
                    `<h2><span style='color: ${
                        Docsify.METHOD_COLORS[<keyof typeof Docsify.METHOD_COLORS>endpoint.method] ?? "#68BEDB"
                    }'>${endpoint.method}</span> ${endpoint.path}</h2>`,
                    endpoint.description
                ];
                
                if (endpoint.url_params) {
                    markdown.push(
                        "### URL Parameters",
                        this.constructRecordBody("Parameter", endpoint.url_params)
                    );
                }

                if (endpoint.query_params) {
                    markdown.push(
                        "### URL Query Parameters",
                        this.constructRecordBody("Parameter", endpoint.query_params)
                    );
                }

                if (endpoint.headers) {
                    markdown.push(
                        "### Headers",
                        this.constructRecordBody("Header", endpoint.headers)
                    );
                }

                if (endpoint.post_body) {
                    const infoBody = this.constructInfoBody(endpoint.post_body);

                    if (infoBody.length) {
                        markdown.push("### Post Body", ...infoBody);
                    }
                }

                markdown.push("### Return Body");

                if (endpoint.return_body) {
                    const infoBody = this.constructInfoBody(endpoint.return_body);

                    if (infoBody.length) {
                        markdown.push(...infoBody);
                    } else {
                        markdown.push("*No return body*");
                    }
                } else {
                    markdown.push("*No return body*");
                }

                return markdown.join("\n\n");
            }),
            this.documentationToMarkdown("Enumerations", this.enums),
            this.documentationToMarkdown("Definitions", this.definitions)
        ].filter(Boolean).join("\n\n");
    }

    private documentationToMarkdown(field: string, documentation: DocumentationInfo[]): string {
        if (documentation.length) {
            return [
                `## ${field}`,
                ...documentation.filter(
                    ({ title }, index) => documentation.findIndex(({ title: otherTitle }) => title == otherTitle) == index
                ).map(({ title, description, table }) => ([
                    `### ${title}`,
                    description,
                    table
                ]).join("\n\n"))
            ].join("\n\n");
        } else {
            return "";
        }
    }

    private recursiveConstructor(object: ObjectDefinition): void {
        this.definitions.push({
            title: object.$info.type,
            description: object.$info.description,
            table: this.constructTable([
                "Field",
                "Type",
                "Description",
                " "
            ], <string[][]>Object.entries(object).filter(([ field ]) => field != "$info").map(
                ([ field, info ]) => this.constructInfoRow(info, object.$info.partial, field)
            ).filter(Boolean))
        });
    }

    private constructRecordBody(recordName: string, record: Record<string, string>): string {
        return this.constructTable([
            recordName,
            "Description"
        ], Object.entries(record));
    }

    private constructInfoBody(type: definition): string[] {
        const row = this.constructInfoRow(
            type,
            (Array.isArray(type) ? type[0] : "$info" in type ? type.$info : type).partial
        );

        if (row) {
            const index = this.definitions.reverse().findIndex(
                ({ title }) => title == row[1].split(/(?:^|:\s)\[([\w]+?)\]\([\s\w#]+?\)$/)[1]
            );

            if (index != -1) {
                const info = this.definitions.splice(index, 1)[0];
                
                return [ info.description, info.table ];
            } else {
                return [ row[2], row[1] ];
            }
        } else {
            return [ ];
        }
    }

    private constructInfoRow(info: definition, partial: boolean = false, field: string = "-"): undefined | string[] {
        if (Array.isArray(info)) {
            if (info.length) {
                const fieldInfo = this.constructField(field, info[0], partial);
                
                info.slice(1).forEach((object) => this.recursiveConstructor(<ObjectDefinition>object));

                if (info[0].partial) {
                    fieldInfo[1] = `A partial array of: ${fieldInfo[1].split(": ")[1]}`;
                } else {
                    fieldInfo[1] = `An array of: ${fieldInfo[1]}`;
                }

                return fieldInfo;
            } else {
                return undefined;
            }
        } else if ("$info" in info) {
            this.recursiveConstructor(info);

            return this.constructField(field, info.$info, partial);
        } else {
            return this.constructField(field, info, partial);
        }
    }

    private constructType(types: string | string[]): string {
        return (Array.isArray(types) ? types : [ types ]).map(
            (type) => /^[a-z]+(?:\[\])?$/.test(type) ? `\`${type}\`` : `[${type}](#${type.toLowerCase()})`
        ).join(" or ");
    }

    private constructField(field: string, info: TypeDefinition, forceOptional: boolean = false): string[] {
        if (info.enum) {
            this.enums.push({
                title: info.type[0],
                description: info.description,
                table: this.constructEnumTable(info.enum)
            });
        }

        return [
            field,
            (info.partial ? "A partial of: " : "") + this.constructType(info.type),
            info.description,
            info.optional || forceOptional ? "*Optional*" : "*Required*"
        ];
    }

    private constructTable(fields: string[], table: string[][]): string {
        const rows: string[] = [];

        rows.push(`|${fields.join("|")}|`);
        rows.push(`|${Array(fields.length).fill("-").join("|")}|`);
        rows.push(...table.map((entries) => `|${entries.slice(0, fields.length).join("|")}|`));

        return rows.join("\n");
    }

    private constructEnumTable(enumeration: Record<string, EnumField>): string {
        return this.constructTable([
            "Field",
            "Value",
            "Description"
        ], Object.entries(enumeration).map(
            ([ field, { value, description } ]) => [ field, value.toString(), description ]
        ));
    }
}