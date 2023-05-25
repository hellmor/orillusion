import { ComponentBase } from "../../../src";
import { ISerialization } from "./ISerialization";

export class SComponent implements ISerialization {
    serialize(source: any, obj: any) {
        if (source instanceof ComponentBase) {
        }
    }

    unSerialize(obj: any) {
        throw new Error("Method not implemented.");
    }
}  