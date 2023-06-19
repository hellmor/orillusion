import { IsNonSerialize } from "../../src/util/SerializeDecoration";
import { ISerializeAssetsCollect } from "./ISerializeAssetsCollect";
import { SerializationTypes } from "./SerializationTypes";

export class SerializationUtil {

    public static serialization(source: any, assets: ISerializeAssetsCollect): any {
        SerializationTypes.registerAll();

        let util = SerializationTypes.getSerializeByInstance(source);
        if (util) {
            return util.serialize(source, assets);
        } else {
            return this.serialization2(source, assets);
        }
    }

    public static serialization2(source: any, assets: ISerializeAssetsCollect, dst?): any {
        if (!dst) dst = {};

        for (const key in source) {
            if (key.indexOf('_') != -1)
                continue;
            let noSerialize = IsNonSerialize(source, key)
            if (noSerialize) {
                continue;
            }
            this.serializationNode(source, assets, key, dst);
        }
        return dst;
    }

    public static serializationNode(source: any, assets: ISerializeAssetsCollect, property: string, dst: any) {
        let ins = source[property];
        let t = typeof ins;

        let isValueObject = t == 'number' || t == 'boolean' || t == 'string';
        if (isValueObject) {
            dst[property] = ins;
        } else if (ins) {
            let util = SerializationTypes.getSerializeByInstance(ins);
            if (util) {
                dst[property] = util.serialize(ins, assets);
            }
        }
        return dst;
    }
}