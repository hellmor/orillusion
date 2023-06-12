import { Vector4, View3D } from "@orillusion/core";
import { ISerializeAssetsCollect } from "../ISerializeAssetsCollect";
import { SerializeAble, SerializeView3D } from "../SerializeData";
import { UnSerializeData } from "../unSerialize/UnSerializeData";

export class SView3D extends SerializeAble {
    serialize(source: View3D, assets: ISerializeAssetsCollect) {
        let dst = new SerializeView3D();
        let viewPort = source.viewPort;
        dst.x = viewPort.x;
        dst.y = viewPort.y;
        dst.width = viewPort.width;
        dst.height = viewPort.height;
        dst.enable = source.enable;
        return dst;
    }

    unSerialize(target: View3D, nodeData: SerializeView3D, root: UnSerializeData) {
        let viewPort = new Vector4();
        viewPort.x = nodeData.x;
        viewPort.y = nodeData.y;
        viewPort.z = nodeData.width;
        viewPort.w = nodeData.height;
        target.viewPort = viewPort;
        target.enable = nodeData.enable;

        //
        target.camera = root.cameras[0];
        target.scene = root.scene;
        return target;
    }
}
