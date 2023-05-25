import { Transform } from "../../../src";
import { ISerialization } from "./ISerialization";

export class STransform implements ISerialization {
    serialize(source: any, obj: any) {
        if (source instanceof Transform) {
            obj.x = source.x;
            obj.y = source.y;
            obj.z = source.z;

            obj.rotationX = source.rotationX;
            obj.rotationY = source.rotationY;
            obj.rotationZ = source.rotationZ;

            obj.scaleX = source.scaleX;
            obj.scaleY = source.scaleY;
            obj.scaleZ = source.scaleZ;
        }
    }

    unSerialize(obj: any) {
        throw new Error("Method not implemented.");
    }
}