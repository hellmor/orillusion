import { VirtualTexture } from '../../../textures/VirtualTexture';
import { StorageGPUBuffer } from '../../graphics/webGpu/core/buffer/StorageGPUBuffer';
import { UniformGPUBuffer } from '../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { WebGPUDescriptorCreator } from '../../graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { ComputeShader } from '../../graphics/webGpu/shader/ComputeShader';
import { GPUTextureFormat } from '../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { GPUContext } from '../GPUContext';
import { RendererPassState } from '../passRenderer/state/RendererPassState';
import { PostBase } from './PostBase';
import { View3D } from '../../../core/View3D';
import { RTDescriptor } from '../../graphics/webGpu/descriptor/RTDescriptor';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RTFrame } from '../frame/RTFrame';
import { CCL_Label } from './ccl/CCL_Label';
import { Plane3D } from '../../../math/Plane3D';

export class CCLQueryPost extends PostBase {
    /**
     * @internal
     */
    outputTexture: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    /**
     * @internal
     */
    cclCompute: ComputeShader;
    /**
     * @internal
     */
    selectPlaneBuffer: UniformGPUBuffer;
    selectPlaneArray: Float32Array;
    /**
     * @internal
     */
    cclBuffer: StorageGPUBuffer;
    planeUniform: UniformGPUBuffer;

    rtFrame: RTFrame;



    /**
     * @internal
     */
    onAttach(view: View3D,) {
    }
    /**
     * @internal
     */Render
    onDetach(view: View3D,) {
    }

    public setPickData(plane: Plane3D, meshID: number = -1): this {
        this.selectPlaneArray ||= new Float32Array(8);
        if (!plane) this.selectPlaneArray.fill(0);
        else {
            this.selectPlaneArray[0] = plane.a;
            this.selectPlaneArray[1] = plane.b;
            this.selectPlaneArray[2] = plane.c;
            this.selectPlaneArray[3] = plane.d;
            this.selectPlaneArray[4] = meshID;
        }
        this.selectPlaneBuffer.setFloat32Array('data', this.selectPlaneArray);
        return this;
    }

    private createCompute() {
        this.cclCompute = new ComputeShader(CCL_Label);

        this.selectPlaneBuffer = new UniformGPUBuffer(8);
        this.cclCompute.setUniformBuffer('pickData', this.selectPlaneBuffer);

        this.cclBuffer = new StorageGPUBuffer(this.outputTexture.width * this.outputTexture.height);
        this.cclCompute.setStorageBuffer('cclBuffer', this.cclBuffer);

        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        this.cclCompute.setSamplerTexture('posTex', rtFrame.getPositionMap());
        this.cclCompute.setSamplerTexture('normalTex', rtFrame.getNormalMap());
        this.cclCompute.setSamplerTexture('colorTex', rtFrame.getColorMap());
        this.cclCompute.setStorageTexture(`outTex`, this.outputTexture);
    }

    private createResource() {
        let [w, h] = webGPUContext.presentationSize;
        this.outputTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.outputTexture.name = 'cclTex';
        let cclDesc = new RTDescriptor();
        cclDesc.loadOp = `load`;
        this.rtFrame = new RTFrame([this.outputTexture], [cclDesc]);
    }

    /**
     * @internal
     */
    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.cclCompute) {
            this.createResource();
            this.createCompute();
            this.onResize();

            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
            this.rendererPassState.label = "CCL";
        }

        // this.cclSetting.setFloat('maxDistance', maxDistance);
        // this.cclSetting.setFloat('maxPixel', maxPixel);
        // this.cclSetting.setFloat('darkFactor', cfg.darkFactor);
        // this.cclSetting.setFloat('rayMarchSegment', cfg.rayMarchSegment);

        this.selectPlaneBuffer.apply();

        GPUContext.computeCommand(command, [this.cclCompute]);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }

    public onResize() {
        let [w, h] = webGPUContext.presentationSize;
        this.outputTexture.resize(w, h);

        this.cclBuffer.resizeBuffer(w * h);

        this.cclCompute.workerSizeX = Math.ceil(this.outputTexture.width / 8);
        this.cclCompute.workerSizeY = Math.ceil(this.outputTexture.height / 8);
        this.cclCompute.workerSizeZ = 1;
    }
}