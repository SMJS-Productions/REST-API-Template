import { DefinitionType } from "../../types/DefinitionType";
import { DefinitionInfo } from "./DefinitionInfo";

export interface DefinitionObject {
    __info__: DefinitionInfo,
    [key: string]: DefinitionType
}