import { Vector4 } from "@orillusion/core";
import { SerializeProtoData } from "../SerializeProtoData";
import { SerializeAble } from "../SerializeData";
import { UnSerializeData } from "../unSerialize/UnSerializeData";

export class SVector4D extends SerializeAble {
    serialize(source: Vector4, assets: any) {
        return SerializeProtoData.writeVector4(source) as any;
    }

    unSerialize(target: Vector4, data: any, asset: UnSerializeData): Vector4 {
        target ||= new Vector4();
        SerializeProtoData.readVector4(data, target);
        return target;
    }
}