import { DefinitionEnumField } from "../interfaces/definitions/DefinitionEnumField";
import { DefinitionInfo } from "../interfaces/definitions/DefinitionInfo";
import { DefinitionObject } from "../interfaces/definitions/DefinitionObject";
import { DocumentationInfo } from "../interfaces/definitions/DocumentationInfo";
import { Controller } from "../templates/Controller";
import { DefinitionType } from "../types/definitions/DefinitionType";

export class Docsify {

    public static partialize(type: DefinitionType): DefinitionType {
        // Not only does this dereference the first layer, but also all following layers
        const newType = JSON.parse(JSON.stringify(type));

        if (Array.isArray(newType)) {
            // Hello scuffed code, my old friend. I've come to talk with you again.
            (newType[0] ?? {}).optional = true;
        } else if (!("__info__" in newType)) {
            newType.optional = true;
        } else {
            newType.__info__.partial = true;
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
    
    constructor(category: string, controllers: Controller[]) {
        this.definitions = [];

        controllers.forEach(({ definitions }) => {
            if (definitions) {
                definitions.forEach((definition) => this.recursiveConstructor(definition));
            }
        });

        this.markdown = [
            `# ${category}`,
            ...controllers.map((controller) => {
                const markdown = [
                    `<h2><span style='color: ${
                        Docsify.METHOD_COLORS[<keyof typeof Docsify.METHOD_COLORS>controller.method] ?? "#68BEDB"
                    }'>${controller.method}</span> ${controller.path}</h2>`,
                    controller.description
                ];
                
                if (controller.urlParamsDefinition) {
                    markdown.push(
                        "### URL Parameters",
                        this.constructRecordBody("Parameter", controller.urlParamsDefinition)
                    );
                }

                if (controller.urlQueryDefinition) {
                    markdown.push(
                        "### URL Query Parameters",
                        this.constructRecordBody("Parameter", controller.urlQueryDefinition)
                    );
                }

                if (controller.headerDefinition) {
                    markdown.push(
                        "### Headers",
                        this.constructRecordBody("Header", controller.headerDefinition)
                    );
                }

                if (controller.postBodyDefinition) {
                    const infoBody = this.constructInfoBody(controller.postBodyDefinition);

                    if (infoBody.length) {
                        markdown.push("### Post Body", ...infoBody);
                    }
                }

                markdown.push("### Return Body");

                if (controller.returnBodyDefinition) {
                    const infoBody = this.constructInfoBody(controller.returnBodyDefinition);

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

    private recursiveConstructor(object: DefinitionObject): void {
        this.definitions.push({
            title: object.__info__.type,
            description: object.__info__.description,
            table: this.constructTable([
                "Field",
                "Type",
                "Description",
                " "
            ], <string[][]>Object.entries(object).filter(([ field ]) => field != "__info__").map(
                ([ field, info ]) => this.constructInfoRow(info, object.__info__.partial, field)
            ).filter(Boolean))
        });
    }

    private constructRecordBody(recordName: string, record: Record<string, string>): string {
        return this.constructTable([
            recordName,
            "Description"
        ], Object.entries(record));
    }

    private constructInfoBody(type: DefinitionType): string[] {
        const row = this.constructInfoRow(
            type,
            (Array.isArray(type) ? type[0] : "__info__" in type ? type.__info__ : type).optional
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

    private constructInfoRow(info: DefinitionType, partial: boolean = false, field: string = "-"): undefined | string[] {
        if (Array.isArray(info)) {
            if (info.length) {
                const fieldInfo = this.constructField(field, info[0], partial);
                
                info.slice(1).forEach((object) => this.recursiveConstructor(<DefinitionObject>object));

                if (info[0].partial) {
                    fieldInfo[1] = `A partial array of: ${fieldInfo[1].split(": ")[1]}`;
                } else {
                    fieldInfo[1] = `An array of: ${fieldInfo[1]}`;
                }

                return fieldInfo;
            } else {
                return undefined;
            }
        } else if ("__info__" in info) {
            this.recursiveConstructor(info);

            return this.constructField(field, info.__info__, partial);
        } else {
            return this.constructField(field, info, partial);
        }
    }

    private constructType(types: string): string {
        return types.split(/\s*\|\s*/).map(
            (type) => /^[a-z]+(?:\[\])?$/.test(type) ? `\`${type}\`` : `[${type}](#${type.toLowerCase()})`
        ).join(" or ");
    }

    private constructField(field: string, info: DefinitionInfo, forceOptional: boolean = false): string[] {
        if (info.enum && !info.type.includes("|")) {
            this.enums.push({
                title: info.type,
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

    private constructEnumTable(enumeration: Record<string, DefinitionEnumField>): string {
        return this.constructTable([
            "Field",
            "Value",
            "Description"
        ], Object.entries(enumeration).map(
            ([ field, { value, description } ]) => [ field, value.toString(), description ]
        ));
    }
}