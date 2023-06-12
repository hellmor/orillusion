import { Vector4 } from "@orillusion/core";
import { SerializeProtoData } from "../SerializeProtoData";
import { ISerialization } from "./ISerialization";

export class SVector4D implements ISerialization {
    serialize(source: Vector4, assets: any) {
        return SerializeProtoData.writeVector4(source) as any;
    }

    unSerialize(obj: any) {
        throw new Error("Method not implemented.");
    }
}