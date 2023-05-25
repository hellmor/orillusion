import { Vector3 } from "../../../src";
import { ISerialization } from "./ISerialization";

export class SVector3D implements ISerialization {
    serialize(source: any, obj: any) {
        if (source instanceof Vector3) {
            obj.x = source.x;
            obj.y = source.y;
            obj.z = source.z;
        }
    }

    unSerialize(obj: any) {
        throw new Error("Method not implemented.");
    }
}