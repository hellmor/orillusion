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
import { Plane3D } from '../../../math/Plane3D';
import { CCL_Index } from './ccl/CCL_Index';
import { CCL_Partition } from './ccl/CCL_Partition';
import { CCL_Blend } from './ccl/CCL_Blend';
import { CCL_BorderLinkClear } from './ccl/CCL_BorderLinkClear';
import { CCL_BorderLinkGen } from './ccl/CCL_BorderLinkGen';
import { CCL_BorderLinkRedirect } from './ccl/CCL_BorderLinkRedirect';
import { CCL_VerticalScan } from './ccl/CCL_VerticleScan';
import { Color } from '../../../math/Color';

export class CCLQueryPost extends PostBase {
    private outputTexture: VirtualTexture;
    private rendererPassState: RendererPassState;
    private indexCompute: ComputeShader;
    private verticleScanCompute: ComputeShader;
    private partitionCompute: ComputeShader;
    private borderLinkClearCompute: ComputeShader;
    private borderLinkGenCompute: ComputeShader;
    private redirectLinkCompute: ComputeShader;
    private blendCompute: ComputeShader;
    private selectColorUniform: UniformGPUBuffer;
    private cclUniformData: UniformGPUBuffer;
    private cclUniformArray: Float32Array;
    private cclBuffer: StorageGPUBuffer;
    private borderLinkBuffer: StorageGPUBuffer;
    private redrectLinkBuffer: StorageGPUBuffer;
    private borderLinkAtomic: StorageGPUBuffer;
    private rtFrame: RTFrame;

    private readonly GridCount = 64;

    public readonly selectPlaneColor: Color = new Color(0.6, 0.2, 0.2, 0.8);
    private _activePost: boolean = true;
    public get activePost(): boolean {
        return this._activePost;
    }
    public set activePost(value: boolean) {
        this._activePost = value;
    }

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

    public setPickData(plane: Plane3D, coordX: number = -1, coordY: number = -1, meshID: number = -1): this {
        this.cclUniformArray ||= new Float32Array(12);
        if (!plane) this.cclUniformArray.fill(0);
        else {
            this.cclUniformArray[0] = plane.a;
            this.cclUniformArray[1] = plane.b;
            this.cclUniformArray[2] = plane.c;
            this.cclUniformArray[3] = plane.d;
            this.cclUniformArray[4] = coordX;
            this.cclUniformArray[5] = coordY;
            this.cclUniformArray[6] = meshID;
        }
        let [w, h] = webGPUContext.presentationSize;
        this.cclUniformArray[7] = w;
        this.cclUniformArray[8] = h;
        this.cclUniformArray[9] = this.GridCount;
        this.cclUniformArray[10] = this.activePost ? 1 : 0;

        this.cclUniformData.setFloat32Array('data', this.cclUniformArray);
        return this;
    }

    private createCompute() {
        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        this.cclUniformData = new UniformGPUBuffer(12);

        this.selectColorUniform = new UniformGPUBuffer(4);
        this.selectColorUniform.setColor('data', this.selectPlaneColor);

        this.cclBuffer = new StorageGPUBuffer(this.outputTexture.width * this.outputTexture.height);
        this.borderLinkBuffer = new StorageGPUBuffer(this.outputTexture.width * this.outputTexture.height * 2);
        this.redrectLinkBuffer = new StorageGPUBuffer(this.outputTexture.width * this.outputTexture.height);
        //index
        this.indexCompute = new ComputeShader(CCL_Index);
        this.indexCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.indexCompute.setStorageBuffer('cclBuffer', this.cclBuffer);
        this.indexCompute.setSamplerTexture('posTex', rtFrame.getPositionMap());
        this.indexCompute.setSamplerTexture('normalTex', rtFrame.getNormalMap());
        //verticle scan
        this.verticleScanCompute = new ComputeShader(CCL_VerticalScan);
        this.verticleScanCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.verticleScanCompute.setStorageBuffer('cclBuffer', this.cclBuffer);

        //partition
        this.partitionCompute = new ComputeShader(CCL_Partition);
        this.partitionCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.partitionCompute.setStorageBuffer('cclBuffer', this.cclBuffer);
        //border clear
        this.borderLinkClearCompute = new ComputeShader(CCL_BorderLinkClear);
        this.borderLinkClearCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.borderLinkClearCompute.setStorageBuffer('borderLinkBuffer', this.borderLinkBuffer);
        this.borderLinkClearCompute.setStorageBuffer('labelRedirectBuffer', this.redrectLinkBuffer);
        //border link
        this.borderLinkGenCompute = new ComputeShader(CCL_BorderLinkGen);
        this.borderLinkGenCompute.setStorageBuffer("borderLinkAtomic", this.borderLinkAtomic);
        this.borderLinkGenCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.borderLinkGenCompute.setStorageBuffer('cclBuffer', this.cclBuffer);
        this.borderLinkGenCompute.setStorageBuffer('borderLinkBuffer', this.borderLinkBuffer);
        //redirect
        this.redirectLinkCompute = new ComputeShader(CCL_BorderLinkRedirect);
        this.redirectLinkCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.redirectLinkCompute.setStorageBuffer('borderLinkBuffer', this.borderLinkBuffer);
        this.redirectLinkCompute.setStorageBuffer('labelRedirectBuffer', this.redrectLinkBuffer);
        //blend
        this.blendCompute = new ComputeShader(CCL_Blend);
        this.blendCompute.setUniformBuffer('selectPlaneColor', this.selectColorUniform);
        this.blendCompute.setUniformBuffer('cclUniformData', this.cclUniformData);
        this.blendCompute.setStorageBuffer('cclBuffer', this.cclBuffer);
        this.blendCompute.setStorageBuffer('labelRedirectBuffer', this.redrectLinkBuffer);
        this.blendCompute.setSamplerTexture('colorTex', rtFrame.getColorMap());
        this.blendCompute.setStorageTexture(`outTex`, this.outputTexture);
    }

    private createResource() {
        this.initAtomicBuffer();

        let [w, h] = webGPUContext.presentationSize;
        this.outputTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.outputTexture.name = 'cclTex';
        let cclDesc = new RTDescriptor();
        cclDesc.loadOp = `load`;
        this.rtFrame = new RTFrame([this.outputTexture], [cclDesc]);
    }

    protected initAtomicBuffer() {
        this.borderLinkAtomic = new StorageGPUBuffer(4);
        this.borderLinkAtomic.setUint32("linkIndex", 0.0);
        this.borderLinkAtomic.setUint32("slot0", 0.0);
        this.borderLinkAtomic.setUint32("slot1", 0.0);
        this.borderLinkAtomic.setUint32("slot2", 0.0);
    }

    activeComputes: ComputeShader[];
    deactiveComputes: ComputeShader[];

    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.indexCompute) {
            this.createResource();
            this.createCompute();
            this.onResize();

            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
            this.rendererPassState.label = "CCL";
        }

        if (!this.activeComputes) {
            this.activeComputes =
                [this.indexCompute, this.partitionCompute,
                this.borderLinkClearCompute, this.borderLinkGenCompute,
                this.redirectLinkCompute, this.blendCompute];

            this.deactiveComputes = [this.blendCompute];
        }
        this.selectColorUniform.setColor('data', this.selectPlaneColor);
        this.selectColorUniform.apply();
        this.cclUniformData.apply();
        this.borderLinkAtomic.apply();
        if (this.activePost) {
            GPUContext.computeCommand(command, this.activeComputes);
        } else {
            GPUContext.computeCommand(command, this.deactiveComputes);

        }
        GPUContext.lastRenderPassState = this.rendererPassState;
    }

    public onResize() {
        let [w, h] = webGPUContext.presentationSize;
        this.outputTexture.resize(w, h);

        this.cclBuffer.resizeBuffer(w * h);
        this.borderLinkBuffer.resizeBuffer(w * h * 2);
        this.redrectLinkBuffer.resizeBuffer(w * h);

        let fullWorkerSizeX = Math.ceil(w / 8);
        let fullWorkerSizeY = Math.ceil(h / 8);

        this.indexCompute.workerSizeX = fullWorkerSizeX;
        this.indexCompute.workerSizeY = fullWorkerSizeY;
        this.indexCompute.workerSizeZ = 1;

        this.verticleScanCompute.workerSizeX = fullWorkerSizeX;
        this.verticleScanCompute.workerSizeY = 1;
        this.verticleScanCompute.workerSizeZ = 1;

        this.borderLinkClearCompute.workerSizeX = fullWorkerSizeX;
        this.borderLinkClearCompute.workerSizeY = fullWorkerSizeY;
        this.borderLinkClearCompute.workerSizeZ = 1;

        //partition grid 4*4
        const gridCount = this.GridCount;
        this.partitionCompute.workerSizeX = Math.ceil(fullWorkerSizeX / gridCount);
        this.partitionCompute.workerSizeY = Math.ceil(fullWorkerSizeY / gridCount);
        this.partitionCompute.workerSizeZ = 1;

        this.borderLinkGenCompute.workerSizeX = Math.ceil(fullWorkerSizeX / gridCount);
        this.borderLinkGenCompute.workerSizeY = Math.ceil(fullWorkerSizeY / gridCount);
        this.borderLinkGenCompute.workerSizeZ = 1;

        this.redirectLinkCompute.workerSizeX = fullWorkerSizeX;
        this.redirectLinkCompute.workerSizeY = fullWorkerSizeY;
        this.redirectLinkCompute.workerSizeZ = 1;

        this.blendCompute.workerSizeX = fullWorkerSizeX;
        this.blendCompute.workerSizeY = fullWorkerSizeY;
        this.blendCompute.workerSizeZ = 1;

        this.setPickData(null);
    }
}