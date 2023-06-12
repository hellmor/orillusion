import { ISerializeAssetsCollect } from "@orillusion/serialization/ISerializeAssetsCollect";
import { SerializeAble, SerializeComponentBase } from "@orillusion/serialization/SerializeData";
import { UnSerializeData } from "@orillusion/serialization/unSerialize/UnSerializeData";
import { ComponentBase } from "@orillusion/core";
import { SerializationTypes } from "@orillusion/serialization/SerializationTypes";
import { SerializationUtil } from "@orillusion/serialization/SerializationUtil";
import { UnSerializationUtil } from "@orillusion/serialization/unSerialize/UnSerializationUtil";

export class SComponentBase implements SerializeAble {
    /**
     * @internal
     */
    public serialize(target: ComponentBase, assets: ISerializeAssetsCollect): SerializeComponentBase {
        let data: SerializeComponentBase = new SerializeComponentBase();
        this.serializeBase(target, data);

        SerializationUtil.serialization2(target, assets, data);
        return data;
    }

    protected serializeBase(target: ComponentBase, dst: SerializeComponentBase): SerializeComponentBase {
        dst.enable = target.enable;
        let className = target.constructor.name;
        if (className.indexOf("_") >= 0) {
            className = SerializationTypes.getClassName(target);
        }
        dst.className = className;
        return dst;
    }

    /**
     * @internal
     */
    public unSerialize(target: any, data: SerializeComponentBase, assets: UnSerializeData) {
        UnSerializationUtil.serialization2(target, data, assets);
    }
}
