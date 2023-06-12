import { ISerializeAssetsCollect } from "../ISerializeAssetsCollect";

export interface ISerialization {
    serialize(source: any, assets: ISerializeAssetsCollect, dst: any);
    unSerialize(target: any, componentData: any, data: any);
}