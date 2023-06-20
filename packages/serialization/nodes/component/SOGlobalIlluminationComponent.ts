import { ISerializeAssetsCollect } from "@orillusion/serialization/ISerializeAssetsCollect";
import { SerializeComponentBase } from "@orillusion/serialization/SerializeData";
import { UnSerializeData } from "@orillusion/serialization/unSerialize/UnSerializeData";
import { SComponentBase } from "./SComponentBase";

export class SOGlobalIlluminationComponent extends SComponentBase {
    public serialize(target: any, assets: ISerializeAssetsCollect): SerializeComponentBase {
        // let component = target as GlobalIlluminationComponent;

        // let data: SerializeRendererNode = new SerializeRendererNode();
        // data.enable = component.enable;
        // data.componentType = component.componentType;

        // return data;
        return null;
    }

    unSerialize(target: any, componentData: SerializeComponentBase, data: UnSerializeData) {

    }
}
