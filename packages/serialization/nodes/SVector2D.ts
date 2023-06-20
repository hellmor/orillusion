import { Vector2 } from "@orillusion/core";
import { SerializeAble } from "../SerializeData";
import { SerializeProtoData } from "../SerializeProtoData";
import { UnSerializeData } from "../unSerialize/UnSerializeData";

export class SVector2D extends SerializeAble {
    serialize(source: Vector2, assets: any) {
        return SerializeProtoData.writeVector2(source) as any;
    }

    unSerialize(target: Vector2, data: any, asset: UnSerializeData): Vector2 {
        target ||= new Vector2();
        SerializeProtoData.readVector2(data, target);
        return target;
    }
}