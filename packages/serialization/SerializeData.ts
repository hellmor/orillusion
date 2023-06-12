import { Vector3 } from "../../src";
import { ISerializeAssetsCollect } from "./ISerializeAssetsCollect";
import { SerializeTextureInstance, SerializeMaterialInstance, SerializeGeometryInstance } from "./SerializeAssetInstance";
import { SerializeProtoData } from "./SerializeProtoData";
import { ISerialization } from "./nodes/ISerialization";
import { UnSerializeData } from "./unSerialize/UnSerializeData";
export class SerializeAble implements ISerialization {
    serialize(source: any, assets: ISerializeAssetsCollect): SerializeIndex {
        throw new Error("Method not implemented.");
    }
    unSerialize(target: any, data: any, asset: UnSerializeData): any {
        throw new Error("Method not implemented.");
    }

};

export class SerializeIndex {
    public index?: number;
    public name?: string;
}

export class SerializeComponentBase extends SerializeIndex {
    public enable: boolean;
    public componentType: string;
    public data?: any;
}

export class SerializeRendererNode extends SerializeComponentBase {
    public geometry: number;
    public materials: number[];
}

export class SerializeSkyRenderer extends SerializeRendererNode {
    public exposure: number;
    public roughness: number;
    public envMap: number;
}

export class SerializeHoverCameraController extends SerializeComponentBase {
}

export class SerializeTransform extends SerializeComponentBase {
    public scale: SerializeProtoData;
    public euler?: SerializeProtoData;
    public quaternion: SerializeProtoData;
    public position: SerializeProtoData;
}

export class SerializeLightData {
    public lightType: number;
    public radius: number;
    public intensity: number;
    public linear: number;
    public quadratic: number;
    public lightColor: SerializeProtoData;
    public innerAngle: number;
    public outerAngle: number;
    public range: number;
    public lightTangent: Vector3;
    public iesPofiles: number;

}

export class SerializeLightComponent extends SerializeComponentBase {
    public size: number;
    public dirFix: number;
    public lightData: SerializeLightData;
    public castGI: boolean;
    public castShadow: boolean;
}

export class SerializeCamera3D extends SerializeComponentBase {
    public fov: number;
    public near: number;
    public far: number;
    public isShadowCamera: boolean;
    public cameraType: number;
}

export class SerializeObject3D extends SerializeIndex {
    public renderLayer: number;
    public prefabRef?: string;
    public components: SerializeComponentBase[];
    public isScene3D?: boolean;
    public envMap: number;
    public children?: number[];
}

export class SerializeView3D extends SerializeIndex {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public enable: boolean;
}

export class SerializeScene3D extends SerializeObject3D {
    public skyRenderer: SerializeSkyRenderer;
}

export class SerializeVersion {
    major: number = 1;
    minor: number = 0;
}

export class SerializeData {
    public version: SerializeVersion;
    public hierarchy: SerializeObject3D[];

    public textures: SerializeTextureInstance[];
    public materials: SerializeMaterialInstance[];
    public geometries: SerializeGeometryInstance[];

    public engineSetting?: any;
    public view3DList?: SerializeView3D[];
    public gltfList: string[];
    public prefabList: string[];

    public toJson(): string {
        return JSON.stringify(this);
    }
}
