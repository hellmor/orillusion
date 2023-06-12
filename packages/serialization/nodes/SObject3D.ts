import { Object3D } from "@orillusion/core";
import { ISerializeAssetsCollect } from "../ISerializeAssetsCollect";
import { SerializationUtil } from "../SerializationUtil";
import { SerializeAble, SerializeComponentBase, SerializeObject3D, SerializeScene3D } from "../SerializeData";
import { UnSerializeData } from "../unSerialize/UnSerializeData";

export class SObject3D extends SerializeAble {
    serialize(source: Object3D, assets: ISerializeAssetsCollect) {
        let data = new SerializeObject3D();
        return this.serializeObject3D(source, assets, data);
    }

    protected serializeObject3D(source: Object3D, assets: ISerializeAssetsCollect, dst: SerializeObject3D) {
        dst.name = source.name;
        dst.renderLayer = source.renderLayer;
        dst.components = [];
        dst.prefabRef = source.prefabRef;
        source.components.forEach((v, k) => {
            let component: SerializeComponentBase = SerializationUtil.serialization(v, assets) as any;
            if (component) {
                dst.components.push(component);
            }
        });
        return dst;
    }

    unSerialize(target: any, nodeData: SerializeObject3D, root: UnSerializeData): void {
        let object3D = target as Object3D;
        object3D.name = nodeData.name;
        object3D.prefabRef = nodeData.prefabRef;
        object3D.renderLayer = nodeData.renderLayer;
    }
}

export class SScene3D extends SObject3D {

    serialize(target: any, assets: ISerializeAssetsCollect): SerializeObject3D {
        let data: SerializeScene3D = new SerializeScene3D();
        this.serializeObject3D(target, assets, data);
        data.isScene3D = true;
        // data.skyRenderer = this.skyRender.serialization(assets) as any;
        return data;
    }

    unSerialize(target: any, nodeData: SerializeObject3D, data: UnSerializeData) {
        super.unSerialize(target, nodeData, data);
        let sceneData = nodeData as SerializeScene3D;
        // this.skyRender.unSerialization(sceneData.skyRenderer, data);
        // this.envMap = this.skyRender.map;
    }
}