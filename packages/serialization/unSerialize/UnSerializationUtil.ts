import { SerializationTypes } from "../SerializationTypes";
import { SerializeIndex } from "../SerializeData";
import { UnSerializeData } from "./UnSerializeData";

export class UnSerializationUtil {

    public static unSerialize(instance: any, data: SerializeIndex, assets: UnSerializeData) {
        SerializationTypes.registerAll();

        let util = SerializationTypes.getSerializeByInstance(instance);
        if (util) {
            instance = util.unSerialize(instance, data, assets);
        } else {
            instance = this.serialization2(instance, data, assets);
        }
        return instance;
    }

    public static serialization2(instance: any, data: any, assets: UnSerializeData) {
        for (const key in data) {
            this.serializationNode(instance, data, key, assets);
        }
        return instance;
    }

    public static serializationNode(instance: any, data: any, property: string, assets: UnSerializeData) {
        let attrValue = data[property];
        let t = typeof attrValue;
        if (t == 'string' || t == 'number' || t == 'boolean') {
            instance[property] = attrValue;
        } else if (attrValue) {
            let util = SerializationTypes.getSerializeByInstance(attrValue);
            if (util) {
                instance[property] = util.unSerialize(attrValue, instance[property], assets);
            }
        }
        return instance;
    }
}