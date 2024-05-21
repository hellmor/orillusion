import { Camera3D } from '../../../../core/Camera3D';
import { Engine3D } from '../../../../Engine3D';
import { RenderTexture } from '../../../../textures/RenderTexture';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { CollisionGBufferFrame } from '../../frame/CollisionGBufferFrame';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';
import { RendererBase } from '../RendererBase';
import { PassType } from '../state/RendererType';
import { View3D } from '../../../../core/View3D';
import { CollisionCompute } from './collision/CollisionCompute';
import { CollisionSetting } from './collision/CollisionSettings';
import { Object3D } from '../../../../core/entities/Object3D';
import { Vector3 } from '../../../../math/Vector3';
import { Collision2Compute } from './collision/CollisionCompute2';
import { CEvent } from '../../../../event/CEvent';


enum Collision {
    None,
    FirstProccessing,
    StartSecond,
    SecondProcessing,
}


export let CollisionEventName = 'CollisionEventName';

/**
 * @internal
 * @group Post
 */
export class CollisionPassRenderer extends RendererBase {
    private _camera: Camera3D;
    private _status = Collision.None;
    private _collisionEvent: CEvent;

    public colorMap: RenderTexture;
    public computeCollision: CollisionCompute;
    public computeCollision2: Collision2Compute;
    /**
     * 
     * @param volume 
     */

    static map: RenderTexture;
    constructor() {
        super();
        this._collisionEvent = new CEvent(CollisionEventName);

        this.passType = PassType.COLLISION;

        let collisionGBufferFrame = new CollisionGBufferFrame(CollisionSetting.RTWidth, CollisionSetting.RTHeight, false);
        this.colorMap = collisionGBufferFrame.renderTargets[0];
        CollisionPassRenderer.map = this.colorMap;
        this.computeCollision = new CollisionCompute(this.colorMap);
        this.computeCollision2 = new Collision2Compute(this.computeCollision);

        this.setRenderStates(collisionGBufferFrame);
    }

    cameraPos = new Vector3();
    cameraTarget = new Vector3();
    cameraUp = new Vector3(0, 0, 1);
    private updateCollision(view: View3D, encoder: GPURenderPassEncoder, filter: Set<number>) {
        if (!this._camera) {
            let obj = new Object3D();
            this._camera = obj.addComponent(Camera3D);
            view.scene.addChild(obj);
        }

        let { _camera: camera, cameraPos, cameraTarget, cameraUp } = this;
        let st = CollisionSetting;
        camera.ortho(st.ViewPortWidth, st.ViewPortHeight, st.CameraNear, st.CameraFar);
        cameraPos.set(st.CameraX, st.CameraY, st.CameraZ);
        cameraTarget.copyFrom(cameraPos);
        cameraTarget.y -= 100;
        camera.lookAt(cameraPos, cameraTarget, cameraUp);

        encoder.setViewport(0, 0, CollisionSetting.RTWidth, CollisionSetting.RTHeight, 0.0, 1.0);
        this.renderSceneOnce(view, camera, encoder, filter);
    }

    private renderSceneOnce(view: View3D, orthoCamera: Camera3D, encoder: GPURenderPassEncoder, filter: Set<number>) {

        let collectInfo = EntityCollect.instance.getRenderNodes(view.scene, orthoCamera);
        GPUContext.bindCamera(encoder, orthoCamera);

        let drawMin = Math.max(0, Engine3D.setting.render.drawOpMin);
        let drawMax = Math.min(Engine3D.setting.render.drawOpMax, collectInfo.opaqueList.length);

        let viewRenderList = EntityCollect.instance.getRenderShaderCollect(view);
        for (const renderList of viewRenderList) {
            let nodeMap = renderList[1];
            for (const iterator of nodeMap) {
                let node = iterator[1];
                if (node.preInit) {
                    node.nodeUpdate(view, this.passType, this.rendererPassState, null);
                    break;
                }
            }
        }

        for (let i = drawMin; i < drawMax; ++i) {
            let renderNode = collectInfo.opaqueList[i];
            if (filter && !filter.has(renderNode.transform.worldMatrix.index))
                continue;
            if (renderNode.enable && renderNode.transform.enable) {
                if (!renderNode.preInit) {
                    renderNode.nodeUpdate(view, this.passType, this.rendererPassState, null);
                }
                renderNode.renderPass2(view, this.passType, this.rendererPassState, null, encoder);
            }
        }

        drawMin = Math.max(0, Engine3D.setting.render.drawTrMin);
        drawMax = Math.min(Engine3D.setting.render.drawTrMax, collectInfo.transparentList.length);

        for (let i = drawMin; i < drawMax; ++i) {
            let renderNode = collectInfo.transparentList[i];
            if (filter && !filter.has(renderNode.transform.worldMatrix.index))
                continue;
            if (renderNode.enable && renderNode.transform.enable) {
                if (!renderNode.preInit) {
                    renderNode.nodeUpdate(view, this.passType, this.rendererPassState, null);
                }
                renderNode.renderPass2(view, this.passType, this.rendererPassState, null, encoder);
            }
        }
    }

    private _latestCollisionIDMap: Set<number> = new Set();
    private _historyCollisionIDMap: Set<number> = new Set();
    private updateCollisionIDs(...setList: (Set<number>[])) {
        [this._latestCollisionIDMap, this._historyCollisionIDMap] = [this._historyCollisionIDMap, this._latestCollisionIDMap];

        let ret = this._latestCollisionIDMap;
        ret.clear();
        for (let item of setList) {
            for (let i of item.values()) {
                if (!ret.has(i)) {
                    ret.add(i);
                }
            }
        }

        let isChange = this.compareCollisionChange(this._latestCollisionIDMap, this._historyCollisionIDMap);
        if (isChange) {
            this._collisionEvent.data = { latest: this._latestCollisionIDMap, history: this._historyCollisionIDMap };
            this.dispatchEvent(this._collisionEvent);
            // console.log('=== Collision Data Changed ===');
        }
    }

    compareCollisionChange(latest: Set<number>, history: Set<number>): boolean {
        if (latest.size != history.size)
            return true;
        for (let i of latest.values()) {
            if (!history.has(i)) {
                return true;
            }
        }

        for (let i of history.values()) {
            if (!latest.has(i)) {
                return true;
            }
        }

        return false;
    }
    public render(view: View3D, occlusionSystem: OcclusionSystem) {
        if (this._status == Collision.None) {
            //
            this.renderContext.clean();
            this.renderContext.beginOpaqueRenderPass();
            this.updateCollision(view, this.renderContext.encoder, null);
            this.renderContext.endRenderPass();

            this.computeCollision.compute(view);

            this._status = Collision.FirstProccessing;
        }

        if (this._status == Collision.FirstProccessing) {
            if (!this.computeCollision.isProcessCollision) {
                //是否有遮挡
                if (this.computeCollision.meshIdInvisibleMap.size > 0) {
                    this._status = Collision.StartSecond;
                } else {
                    this._status = Collision.None;
                    this.updateCollisionIDs(this.computeCollision.meshIDCollisionMap, this.computeCollision.meshIdInvisibleMap);
                }
            }
        }

        if (this._status == Collision.StartSecond) {
            if (!this.computeCollision2.isProcessCollision) {
                this.renderContext.clean();
                this.renderContext.beginOpaqueRenderPass();
                this.updateCollision(view, this.renderContext.encoder, this.computeCollision.meshIdInvisibleMap);
                this.renderContext.endRenderPass();

                this.computeCollision2.compute(view);
                this._status = Collision.SecondProcessing;
            }
        }

        if (this._status == Collision.SecondProcessing) {
            if (!this.computeCollision2.isProcessCollision) {
                this._status = Collision.None;
                this.updateCollisionIDs(this.computeCollision.meshIDCollisionMap, this.computeCollision.meshIdInvisibleMap, this.computeCollision2.coverdMeshIds);
            }
        }

    }


}
