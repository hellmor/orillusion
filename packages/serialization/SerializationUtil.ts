import { SerializationTypes } from "./SerializationTypes";

export class SerializationUtil {
    private static _cache: Map<any, boolean>;

    public static serialization(source: any, out?: any) {
        if (!source) return null;
        SerializationTypes.registerAll();

        this._cache ||= new Map<any, boolean>();
        this._cache.clear();

        out = out ? out : {};
        this._cache.set(source, true);

        let ins = source;
        if (ins && ins.constructor.name) {
            let util = SerializationTypes.getSerializeClass(ins.constructor.name);
            if (util) {
                util.serialize(ins, out);
                this._cache.set(ins, true);
            } else {
                for (const key in source) {
                    if (key.indexOf("_") == 0) {
                        continue;
                    }
                    this.serializationNode(source, key, out);
                }
            }
        }
        return out;
    }

    public static serializationNode(source: any, property: string, data: any) {
        let ins = source[property];
        if (ins && ins.constructor.name && !this._cache.get(ins)) {
            let util = SerializationTypes.getSerializeClass(ins.constructor.name);
            if (util) {
                let new_data = data[property] = {};
                util.serialize(ins, new_data);

                this._cache.set(ins, true);
            }
        }
    }
}