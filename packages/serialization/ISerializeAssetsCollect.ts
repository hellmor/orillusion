import { Scene3D, GeometryBase, MaterialBase, Texture } from "@orillusion/core";

export interface ISerializeAssetsCollect {
    collect(scene: Scene3D);

    getGeometryIndex(geometry: GeometryBase): number;

    getMaterialIndex(material: MaterialBase): number;

    getTextureIndex(texture: Texture): number;
}