import { Vector3 } from "@orillusion/core";
import { SerializeProtoData } from "../SerializeProtoData";
import { ISerialization } from "./ISerialization";

export class SVector3D implements ISerialization {
    serialize(source: Vector3, assets: any) {
        return SerializeProtoData.writeVector3(source) as any;
    }

    unSerialize(obj: any) {
        throw new Error("Method not implemented.");
    }
}