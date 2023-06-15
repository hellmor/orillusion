import { ISerializeAssetsCollect } from "@orillusion/serialization/ISerializeAssetsCollect";
import { SerializeComponentBase, SerializeRendererNode, SerializeSkyRenderer } from "@orillusion/serialization/SerializeData";
import { UnSerializeData } from "@orillusion/serialization/unSerialize/UnSerializeData";
import { AtmosphericComponent, MaterialBase, MeshRenderer, RenderNode, SkyRenderer } from "@orillusion/core";
import { SComponentBase } from "./SComponentBase";

export class SRenderNode extends SComponentBase {
    serialize(target: RenderNode, assets: ISerializeAssetsCollect): SerializeComponentBase {
        let data: SerializeRendererNode = new SerializeRendererNode();
        this.serializeBase(target, data);
        data.enable = target.enable;
        data.geometry = assets.getGeometryIndex(target.geometry);
        data.materials = [];
        for (let material of target.materials) {
            data.materials.push(assets.getMaterialIndex(material));
        }
        return data;
    }

    unSerialize(target: any, componentData: SerializeComponentBase, data: UnSerializeData) {

    }
}

export class SMeshRenderer extends SRenderNode {
    unSerialize(target: MeshRenderer, componentData: SerializeComponentBase, data: UnSerializeData): MeshRenderer {
        let cData: SerializeRendererNode = componentData as SerializeRendererNode;
        target.geometry = data.geometries[cData.geometry];
        let materials: MaterialBase[] = [];
        for (let material of cData.materials) {
            materials.push(data.materials[material]);
        }
        target.materials = materials;
        return target;
    }
}


export class SSkyRenderer extends SRenderNode {

    unSerialize(target: SkyRenderer, componentData: SerializeComponentBase, data: UnSerializeData): SkyRenderer {
        let cData: SerializeSkyRenderer = componentData as SerializeSkyRenderer;

        target.map = data.textureList[cData.envMap];
        target.geometry = data.geometries[cData.geometry];
        target.roughness = cData.roughness;
        target.exposure = cData.exposure;
        return target;
    }

    serialize(target: SkyRenderer, assets: ISerializeAssetsCollect): SerializeComponentBase {
        let data: SerializeSkyRenderer = new SerializeSkyRenderer();
        this.serializeBase(target, data);
        //geometry
        data.geometry = assets.getGeometryIndex(target.geometry);
        data.roughness = target.roughness;
        data.exposure = target.exposure;
        data.envMap = assets.getTextureIndex(target.map);
        return data;
    }
}


export class SAtmosphericComponent extends SComponentBase {
    serialize(target: AtmosphericComponent, assets: ISerializeAssetsCollect): SerializeComponentBase {
        let data = new SerializeSkyRenderer();
        this.serializeBase(target, data);
        data.data = target['_atmosphericScatteringSky'].setting;
        return data;
    }

    public unSerialize(target: AtmosphericComponent, componentData: SerializeComponentBase, data: UnSerializeData) {
        target.enable = componentData.enable;
    }
}