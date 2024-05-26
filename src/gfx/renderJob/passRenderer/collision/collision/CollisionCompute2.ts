import {
    View3D,
    ComputeShader,
    GPUContext,
    ComputeGPUBuffer,
    RenderTexture,
    CollisionCompute,
} from "@orillusion/core";
import { CollisionSetting } from "./CollisionSettings";
import { Collision_cover } from "./Collision2_cs";

export class Collision2Compute {
    private collisionCompute: ComputeShader;
    private collisionDstIds: Float32Array;
    private collisionDstIdsBuffer: ComputeGPUBuffer;
    public coverdMeshIds: Set<number> = new Set();
    private _srcCompute: CollisionCompute;
    constructor(srcCompute: CollisionCompute) {
        this._srcCompute = srcCompute;
    }

    private createCompute() {
        let destFloatCount = CollisionSetting.QueryMeshCount;
        this.collisionDstIds = new Float32Array(destFloatCount);
        this.collisionDstIds.fill(-1);//清理用，不做更改
        this.collisionDstIdsBuffer = new ComputeGPUBuffer(destFloatCount);
        this.collisionDstIdsBuffer.setFloat32Array('data', this.collisionDstIds);

        let srcCompute = this._srcCompute;
        //cover caculator
        this.collisionCompute = new ComputeShader(Collision_cover);
        this.collisionCompute.setUniformBuffer('settingData', srcCompute.settingBuffer);
        this.collisionCompute.setStorageBuffer('srcIds', srcCompute.collisionSrcIdsBuffer);
        this.collisionCompute.setStorageBuffer('dstIds', this.collisionDstIdsBuffer);
        this.collisionCompute.setSamplerTexture('mainTex', srcCompute.colorMapCopy);
        this.collisionCompute.setSamplerTexture('subTex', srcCompute.colorMap);
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
        this.coverdMeshIds.clear();

        let outData = this.collisionDstIdsBuffer.outFloat32Array;
        if (outData) {
            let destCount = this._srcCompute.settingUniformArray[3];
            for (let i = 0; i < destCount; i++) {
                let collisionMeshID = outData[i];
                if (collisionMeshID > 0) {
                    this.coverdMeshIds.add(collisionMeshID);
                }
            }

            if (this.coverdMeshIds.size) {
                // console.log('Cover Count', this.coverdMeshIds.size);
            }
        }
    }

}