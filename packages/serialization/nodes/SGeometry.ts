import { BoxGeometry, CylinderGeometry, GeometryBase, PlaneGeometry, SphereGeometry, TorusGeometry } from "@orillusion/core";
import { SerializeGeometryInstance } from "../SerializeAssetInstance";
import { SerializeAble } from "../SerializeData";
import { ISerializeAssetsCollect } from "../ISerializeAssetsCollect";
import { SerializationUtil } from "../SerializationUtil";
import { SerializationTypes } from "../SerializationTypes";

export class SGeometryBase extends SerializeAble {
    serialize(source: GeometryBase, assets: ISerializeAssetsCollect): SerializeGeometryInstance {
        let data = new SerializeGeometryInstance();
        SerializationUtil.serialization2(source, assets, data);
        let className = source.constructor.name;
        if (className.indexOf("_") >= 0) {
            className = SerializationTypes.getClassName(source);
        }
        data.className = className;
        data.asset = source.asset;
        data.name = source.name;
        return data;
    }

    unSerialize(target: any, serializeData: any, root: any) {
        let geometry = target as GeometryBase;
    }
}