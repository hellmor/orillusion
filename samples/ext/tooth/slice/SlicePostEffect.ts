import { PostBase, VirtualTexture, RendererPassState, ComputeShader, ComputeGPUBuffer, RTFrame, GBufferFrame, webGPUContext, GPUTextureFormat, RTDescriptor, View3D, WebGPUDescriptorCreator, GPUContext } from "@orillusion/core";
import { Slice_Cs } from "./Slice_Cs";

export class SlicePostEffect extends PostBase {
    sliceTexture: VirtualTexture;
    rendererPassState: RendererPassState;
    sliceCompute: ComputeShader;
    sliceBuffer: ComputeGPUBuffer;
    rtFrame: RTFrame;
    private createCompute() {
        this.sliceCompute = new ComputeShader(Slice_Cs);

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        this.sliceCompute.setStorageBuffer('sliceBuffer', this.sliceBuffer);
        this.sliceCompute.setSamplerTexture('inTex', rtFrame.getColorMap());
        this.sliceCompute.setStorageTexture(`outTex`, this.sliceTexture);
    }

    private createResource() {
        let [w, h] = webGPUContext.presentationSize;

        this.sliceTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.sliceTexture.name = 'sliceTexture';
        let gtaoDec = new RTDescriptor();
        // gtaoDec.clearValue = [1, 1, 1, 1];
        gtaoDec.loadOp = `load`;
        this.rtFrame = new RTFrame([this.sliceTexture], [gtaoDec]);
        this.sliceBuffer && this.sliceBuffer.destroy();
        this.sliceBuffer = new ComputeGPUBuffer(this.sliceTexture.width * this.sliceTexture.height);
    }

    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.sliceCompute) {
            this.createResource();
            this.createCompute();
            this.onResize();

            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
            this.rendererPassState.label = "SLC";
        }

        GPUContext.computeCommand(command, [this.sliceCompute]);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }

    public onResize() {
        let [w, h] = webGPUContext.presentationSize;
        this.sliceTexture.resize(w, h);

        this.sliceCompute.workerSizeX = Math.ceil(this.sliceTexture.width / 8);
        this.sliceCompute.workerSizeY = Math.ceil(this.sliceTexture.height / 8);
        this.sliceCompute.workerSizeZ = 1;
    }
}