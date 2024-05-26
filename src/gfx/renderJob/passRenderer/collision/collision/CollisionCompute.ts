import {
    View3D,
    webGPUContext,
    ComputeShader,
    GBufferFrame,
    GPUContext,
    StorageGPUBuffer,
    UniformGPUBuffer,
    ComputeGPUBuffer,
    EntityCollect,
    RenderTexture,
    VirtualTexture,
    GPUTextureFormat,
} from "@orillusion/core";
import { CollisionSetting } from "./CollisionSettings";
import { Collision_process } from "./Collision_cs";

export class CollisionCompute {
    public settingBuffer: UniformGPUBuffer;
    public settingUniformArray: Float32Array;
    private collisionCompute: ComputeShader;
    //放入将要碰撞测试的所有MeshID，下标对应meshID
    private collisionSrcIds: Float32Array;
    public collisionSrcIdsBuffer: StorageGPUBuffer;
    //下标-值：根据下标从meshIDToIdx中获得MeshID；根据值获得是否碰撞
    //需要先清理掉。
    private collisionDstIds: Float32Array;
    private collisionDstIdsBuffer: ComputeGPUBuffer;
    public meshIDCollisionMap: Set<number> = new Set();
    private collisionSrcIdsMap: Set<number> = new Set();
    public meshIdInvisibleMap: Set<number> = new Set();

    public colorMap: RenderTexture;
    public colorMapCopy: VirtualTexture;
    constructor(colorMap: RenderTexture) {
        this.colorMap = colorMap;
    }

    private initSetting(): this {
        this.settingUniformArray = new Float32Array(4);
        this.settingUniformArray[0] = CollisionSetting.RTWidth;
        this.settingUniformArray[1] = CollisionSetting.RTHeight;
        this.settingUniformArray[2] = CollisionSetting.QueryMeshCount;
        this.settingUniformArray[3] = 0;

        return this;
    }

    private createCompute() {
        this.initSetting();

        this.settingBuffer = new UniformGPUBuffer(4);
        this.settingBuffer.setFloat32Array('data', this.settingUniformArray);

        this.collisionSrcIds = new Float32Array(CollisionSetting.QueryMeshCount);
        this.collisionSrcIdsBuffer = new ComputeGPUBuffer(CollisionSetting.QueryMeshCount);
        this.collisionSrcIdsBuffer.setFloat32Array('data', this.collisionSrcIds);

        let destFloatCount = CollisionSetting.QueryMeshCount * 2;// [v,v,v...., c,c,c...]
        this.collisionDstIds = new Float32Array(destFloatCount);
        this.collisionDstIds.fill(-1);//清理用，不做更改
        this.collisionDstIdsBuffer = new ComputeGPUBuffer(destFloatCount);
        this.collisionDstIdsBuffer.setFloat32Array('data', this.collisionDstIds);

        //copy
        this.colorMapCopy = new VirtualTexture(CollisionSetting.RTWidth, CollisionSetting.RTHeight, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.colorMapCopy.name = 'cTexCopy';

        //collision caculator
        this.collisionCompute = new ComputeShader(Collision_process);
        this.collisionCompute.setUniformBuffer('settingData', this.settingBuffer);
        this.collisionCompute.setStorageBuffer('srcIds', this.collisionSrcIdsBuffer);
        this.collisionCompute.setStorageBuffer('dstIds', this.collisionDstIdsBuffer);
        this.collisionCompute.setSamplerTexture('colorTex', this.colorMap);
        this.collisionCompute.setStorageTexture('copyTex', this.colorMapCopy);
    }


    public get isProcessCollision() {
        return this.collisionDstIdsBuffer?.['_readFlag'];
    }

    private computes: ComputeShader[];
    compute(view: View3D) {
        if (!this.collisionCompute) {
            this.createCompute();
        }

        this.parseCollisionResult();
        let srcCount = this.collectMeshSourceIdx(view);

        this.settingUniformArray[3] = srcCount;
        this.settingBuffer.setFloat32Array('data', this.settingUniformArray);
        this.settingBuffer.apply();

        this.collisionSrcIdsBuffer.setFloat32Array('data', this.collisionSrcIds);
        this.collisionSrcIdsBuffer.apply();
        this.collisionDstIdsBuffer.setFloat32Array('data', this.collisionDstIds);
        this.collisionDstIdsBuffer.apply();
        this.computes ||= [this.collisionCompute];

        let { RTWidth, RTHeight } = CollisionSetting;

        let fullWorkerSizeX = Math.ceil(RTWidth / 8);
        let fullWorkerSizeY = Math.ceil(RTHeight / 8);

        this.collisionCompute.workerSizeX = fullWorkerSizeX;
        this.collisionCompute.workerSizeY = fullWorkerSizeY;
        this.collisionCompute.workerSizeZ = 1;

        let command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(command, this.computes);
        GPUContext.endCommandEncoder(command);

        this.collisionDstIdsBuffer.readBuffer();
    }

    private parseCollisionResult() {
        this.meshIDCollisionMap.clear();
        let invisible = this.meshIdInvisibleMap;
        //先将所有的id放入不可见列表
        for (let i of this.collisionSrcIdsMap.values()) {
            invisible.add(i);
        }
        let outData = this.collisionDstIdsBuffer.outFloat32Array;
        let maxCount = CollisionSetting.QueryMeshCount;
        if (outData) {
            let destCount = this.settingUniformArray[3];
            for (let i = 0; i < destCount; i++) {
                let visibleLabel = outData[i];
                if (visibleLabel > 0) {
                    //剔除可见的，则为不可见列表
                    let srcMeshID = this.collisionSrcIds[i];
                    invisible.delete(srcMeshID);
                }
                let collisionMeshID = outData[i + maxCount];
                if (collisionMeshID > 0) {
                    this.meshIDCollisionMap.add(collisionMeshID);
                }
            }

            if (this.meshIDCollisionMap.size || this.meshIdInvisibleMap.size) {
                // console.log('碰撞：', this.meshIDCollisionMap.size, '遮挡：', this.meshIdInvisibleMap.size);
            }
        }
    }

    //搜集需要碰撞检测的对象的MeshID
    private collectMeshSourceIdx(view: View3D): number {
        this.collisionSrcIds.fill(0);
        let tempSet = this.collisionSrcIdsMap;

        tempSet.clear();
        let collectInfo = EntityCollect.instance.getRenderNodes(view.scene, view.camera);
        for (let item of collectInfo.opaqueList) {
            if (item.castCollision) {
                let index = item.transform._worldMatrix.index;
                if (!tempSet.has(index)) {
                    tempSet.add(index);
                }
            }
        }

        for (let item of collectInfo.transparentList) {
            if (item.castCollision) {
                let index = item.transform._worldMatrix.index;
                if (!tempSet.has(index)) {
                    tempSet.add(index);
                }
            }
        }

        let ptr = 0;
        tempSet.forEach(index => {
            this.collisionSrcIds[ptr] = index;
            ptr++;
        });

        return tempSet.size;
    }

}