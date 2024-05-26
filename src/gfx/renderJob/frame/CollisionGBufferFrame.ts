import { RenderTexture } from "../../../textures/RenderTexture";
import { GPUTextureFormat } from "../../graphics/webGpu/WebGPUConst";
import { RTDescriptor } from "../../graphics/webGpu/descriptor/RTDescriptor";
import { RTFrame } from "./RTFrame";

export class CollisionGBufferFrame extends RTFrame {
    constructor(rtWidth: number, rtHeight: number, autoResize: boolean = true) {
        super([], []);
        this.createBuffer(rtWidth, rtHeight, autoResize);
    }

    createBuffer(rtWidth: number, rtHeight: number, autoResize: boolean) {
        let attachments = this.renderTargets;
        let rtDescriptors = this.rtDescriptors;

        let colorMap = new RenderTexture(rtWidth, rtHeight, GPUTextureFormat.rgba16float, false, undefined, 1, 0, true, autoResize);
        colorMap.name = `colorMap`;
        let colorDec = new RTDescriptor();
        colorDec.loadOp = `clear`;

        let depthTexture = new RenderTexture(rtWidth, rtHeight, GPUTextureFormat.depth24plus, false, undefined, 1, 0, true, autoResize);
        depthTexture.name = `depthTexture`;
        let depthDec = new RTDescriptor();
        depthDec.loadOp = `clear`;

        attachments.push(colorMap);

        rtDescriptors.push(colorDec);

        this.depthTexture = depthTexture;
    }
}