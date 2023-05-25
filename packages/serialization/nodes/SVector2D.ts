import { Vector2 } from "../../../src";
import { ISerialization } from "./ISerialization";

export class SVector2D implements ISerialization {
    serialize(source: any, obj: any) {
        if (source instanceof Vector2) {
            obj.x = source.x;
            obj.y = source.y;
        }
    }

    unSerialize(obj: any) {
        throw new Error("Method not implemented.");
    }
}