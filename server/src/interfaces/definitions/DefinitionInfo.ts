import { DefinitionEnumField } from "./DefinitionEnumField";

export interface DefinitionInfo {
    description: string,
    type: string,
    optional?: boolean,
    partial?: boolean,
    enum?: Record<string, DefinitionEnumField>
}