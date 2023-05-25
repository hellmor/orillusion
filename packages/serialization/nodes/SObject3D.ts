import { Object3D } from "../../../src";
import { SerializationUtil } from "../SerializationUtil";
import { ISerialization } from "./ISerialization";

export class SObject3D implements ISerialization {
    serialize(source: any, obj: any) {
        if (source instanceof Object3D) {
            SerializationUtil.serializationNode(source, "transform", obj);

            source.components.forEach((v, k) => {
                SerializationUtil.serializationNode(source.components, k, obj);
            });
        }
    }

    unSerialize(obj: any) {
        throw new Error("Method not implemented.");
    }
}