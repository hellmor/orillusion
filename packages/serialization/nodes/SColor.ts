import { Color } from "@orillusion/core";
import { SerializeProtoData } from "../SerializeProtoData";
import { SerializeAble } from "../SerializeData";
import { UnSerializeData } from "../unSerialize/UnSerializeData";

export class SColor extends SerializeAble {
    serialize(source: Color, assets: any) {
        return SerializeProtoData.writeRGBA(source) as any;
    }

    unSerialize(target: Color, data: any, asset: UnSerializeData): Color {
        target ||= new Color();
        SerializeProtoData.readRGBA(data, target);
        return target;
    }
}