import { Vector2 } from "@orillusion/core";
import { SerializeAble } from "../SerializeData";
import { SerializeProtoData } from "../SerializeProtoData";
import { ISerialization } from "./ISerialization";

export class SVector2D extends SerializeAble implements ISerialization {
    serialize(source: Vector2, assets: any) {
        return SerializeProtoData.writeVector2(source) as any;
    }

    unSerialize(obj: any) {
        throw new Error("Method not implemented.");
    }
}