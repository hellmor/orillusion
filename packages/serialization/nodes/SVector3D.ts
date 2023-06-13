import { Vector3 } from "@orillusion/core";
import { SerializeProtoData } from "../SerializeProtoData";
import { SerializeAble } from "../SerializeData";
import { UnSerializeData } from "../unSerialize/UnSerializeData";

export class SVector3D extends SerializeAble {
    serialize(source: Vector3, assets: any) {
        return SerializeProtoData.writeVector3(source) as any;
    }

    unSerialize(target: Vector3, data: any, asset: UnSerializeData): Vector3 {
        target ||= new Vector3();
        SerializeProtoData.readVector3(data, target);
        return target;
    }
}