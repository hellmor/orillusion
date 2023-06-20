import { ISerializeAssetsCollect } from "@orillusion/serialization/ISerializeAssetsCollect";
import { SerializeComponentBase } from "@orillusion/serialization/SerializeData";
import { SerializeProtoData } from "@orillusion/serialization/SerializeProtoData";
import { UnSerializeData } from "@orillusion/serialization/unSerialize/UnSerializeData";
import { ColliderShape, ColliderComponent } from "@orillusion/core";
import { SComponentBase } from "./SComponentBase";

export class SColliderComponent extends SComponentBase {

    public serializationColliderShape(shape: ColliderShape): any {
        let data: any = {};
        data.shapeType = shape.shapeType;
        data.center = SerializeProtoData.writeVector3(shape.center);
        data.size = SerializeProtoData.writeVector3(shape.size);
        return data;
    }

    serialize(collider: ColliderComponent, assets: ISerializeAssetsCollect): SerializeComponentBase {
        let data: SerializeComponentBase = new SerializeComponentBase();
        this.serializeBase(collider, data);
        data.data = this.serializationColliderShape(collider.shape);
        return data;
    }

    unSerialize(target: any, componentData: SerializeComponentBase, data: UnSerializeData) {
        let collider = target as ColliderComponent;
    }
}
