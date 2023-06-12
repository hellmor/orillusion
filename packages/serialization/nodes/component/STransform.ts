import { SerializeComponentBase, SerializeIndex, SerializeTransform } from "@orillusion/serialization/SerializeData";
import { Transform, Vector3 } from "@orillusion/core";
import { ISerializeAssetsCollect } from "@orillusion/serialization/ISerializeAssetsCollect";
import { SerializeProtoData } from "@orillusion/serialization/SerializeProtoData";
import { UnSerializeData } from "@orillusion/serialization/unSerialize/UnSerializeData";
import { SerializationTypes } from "@orillusion/serialization/SerializationTypes";

export class STransform extends SerializeComponentBase {
    serialize(target: any, assets: ISerializeAssetsCollect): SerializeIndex {
        let transform = target as Transform;

        let data: SerializeTransform = new SerializeTransform();
        data.enable = transform.enable;
        data.componentType = SerializationTypes.getClassName(target)

        // data.quaternion = SerializeProtoData.writeVector4(transform._localRotQuat);
        data.euler = SerializeProtoData.writeVector3(transform.localRotation);
        data.position = SerializeProtoData.writeVector3(transform.localPosition);
        data.scale = SerializeProtoData.writeVector3(transform.localScale);

        return data;
    }

    public unSerialize(transform: Transform, componentData: SerializeComponentBase, data: UnSerializeData) {
        transform.enable = componentData.enable;

        let cData: SerializeTransform = componentData as SerializeTransform;
        let scale: Vector3 = new Vector3();
        let position: Vector3 = new Vector3();
        let euler: Vector3 = new Vector3();
        SerializeProtoData.readVector3(cData.position, position);
        SerializeProtoData.readVector3(cData.scale, scale);
        SerializeProtoData.readVector3(cData.euler, euler);
        transform.localPosition = position;
        transform.localScale = scale;
        transform.localRotation = euler;
        return transform;
    }
}