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
import { CCL_Index } from './ccl/CCL_Index';
import { Plane3D } from '../../../math/Plane3D';
import { CCL_Partition } from './ccl/CCL_Partition';
import { CCL_Blend } from './ccl/CCL_Blend';

export class CCLQueryPost extends PostBase {
    /**
     * @internal
     */
    outputTexture: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    indexCompute: ComputeShader;
    partitionCompute: ComputeShader;
    blendCompute: ComputeShader;
    cclUniformData: UniformGPUBuffer;
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
        let [w, h] = webGPUContext.presentationSize;
        this.selectPlaneArray[5] = w;
        this.selectPlaneArray[6] = h;

        this.cclUniformData.setFloat32Array('data', this.selectPlaneArray);
        return this;
    }

    private createCompute() {
        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        this.cclUniformData = new UniformGPUBuffer(8);
        this.setPickData(null);
        this.cclBuffer = new StorageGPUBuffer(this.outputTexture.width * this.outputTexture.height);
        //index
        this.indexCompute = new ComputeShader(CCL_Index);
        this.indexCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.indexCompute.setStorageBuffer('cclBuffer', this.cclBuffer);
        this.indexCompute.setSamplerTexture('posTex', rtFrame.getPositionMap());
        this.indexCompute.setSamplerTexture('normalTex', rtFrame.getNormalMap());
        //partition
        this.partitionCompute = new ComputeShader(CCL_Partition);
        this.partitionCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.partitionCompute.setStorageBuffer('cclBuffer', this.cclBuffer);

        //blend
        this.blendCompute = new ComputeShader(CCL_Blend);
        this.blendCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.blendCompute.setStorageBuffer('cclBuffer', this.cclBuffer);
        this.blendCompute.setSamplerTexture('colorTex', rtFrame.getColorMap());
        this.blendCompute.setStorageTexture(`outTex`, this.outputTexture);
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
        if (!this.indexCompute) {
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

        this.cclUniformData.apply();

        GPUContext.computeCommand(command, [this.indexCompute, this.partitionCompute, this.blendCompute]);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }

    public onResize() {
        let [w, h] = webGPUContext.presentationSize;
        this.outputTexture.resize(w, h);

        this.cclBuffer.resizeBuffer(w * h);

        let fullWorkerSizeX = Math.ceil(w / 8);
        let fullWorkerSizeY = Math.ceil(h / 8);

        this.indexCompute.workerSizeX = fullWorkerSizeX;
        this.indexCompute.workerSizeY = fullWorkerSizeY;
        this.indexCompute.workerSizeZ = 1;

        this.blendCompute.workerSizeX = fullWorkerSizeX;
        this.blendCompute.workerSizeY = fullWorkerSizeY;
        this.blendCompute.workerSizeZ = 1;

        //partition grid 3*3
        this.partitionCompute.workerSizeX = Math.ceil(w / 24);
        this.partitionCompute.workerSizeY = Math.ceil(h / 24);
        this.partitionCompute.workerSizeZ = 1;

    }
}