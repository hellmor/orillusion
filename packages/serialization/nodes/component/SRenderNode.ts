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
    unSerialize(target: MeshRenderer, componentData: SerializeComponentBase, data: UnSerializeData): void {
        let cData: SerializeRendererNode = componentData as SerializeRendererNode;
        target.geometry = data.geometries[cData.geometry];
        let materials: MaterialBase[] = [];
        for (let material of cData.materials) {
            materials.push(data.materials[material]);
        }
        target.materials = materials;
    }
}


export class SSkyRenderer extends SRenderNode {

    unSerialize(target: any, componentData: SerializeComponentBase, data: UnSerializeData): void {
        let component = target as SkyRenderer;
        let cData: SerializeSkyRenderer = componentData as SerializeSkyRenderer;

        component.map = data.textureList[cData.envMap];
        component.geometry = data.geometries[cData.geometry];
        component.roughness = cData.roughness;
        component.exposure = cData.exposure;
    }

    serialize(component: SkyRenderer, assets: ISerializeAssetsCollect): SerializeComponentBase {
        let data: SerializeSkyRenderer = new SerializeSkyRenderer();
        this.serializeBase(component, data);
        //geometry
        data.geometry = assets.getGeometryIndex(component.geometry);
        data.roughness = component.roughness;
        data.exposure = component.exposure;
        data.envMap = assets.getTextureIndex(component.map);
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

    public unSerialize(target: any, componentData: SerializeComponentBase, data: UnSerializeData) {
        let transform = target as AtmosphericComponent;
        transform.enable = componentData.enable;
    }
}