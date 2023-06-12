import { Object3D } from "../../../core/entities/Object3D";
import { webGPUContext } from "../../../gfx/graphics/webGpu/Context3D";
import { ComponentBase } from "../../ComponentBase";
import { GUIConfig } from "../GUIConfig";
import { UIPanel } from "../uiComponents/UIPanel";
import { UITransform } from "../uiComponents/UITransform";
import { GUIGeometryRebuild } from "./GUIGeometryRebuild";
import { GUIMaterial } from "./GUIMaterial";
import { GUIMesh } from "./GUIMesh";

/**
 * GUI Root Container
 * @group GPU GUI
 */
export class GUICanvas extends ComponentBase {
    private _rebuild: GUIGeometryRebuild;

    public readonly isGUICanvas: boolean = true;
    public index: number = 0;
    init() {
        super.init();
        this._rebuild = new GUIGeometryRebuild();
    }

    /**
     *
     * Add an Object3D
     * @param child Object3D
     * @returns
     */
    public addChild(child: Object3D): this {
        this.object3D.addChild(child);
        return this;
    }

    /**
    *
    * Remove the child
    * @param child Removed Object3D
    */
    public removeChild(child: Object3D): this {
        this.object3D.removeChild(child);
        return this;
    }

    onUpdate() {
        this.rebuildGUIMesh();
    }

    private rebuildGUIMesh() {
        let panelList: UIPanel[] = this.object3D.getComponentsByProperty('isUIPanel', true, true);

        let camera = this.object3D?.transform?.view3D?.camera;
        let screenWidth = webGPUContext.canvas.clientWidth;
        let screenHeight = webGPUContext.canvas.clientHeight;
        let transforms: UITransform[] = [];
        for (let panel of panelList) {
            transforms.length = 0;
            let guiMesh: GUIMesh = panel.guiMesh;
            panel.object3D.getComponents(UITransform, transforms);
            if (transforms.length > 0) {
                this._rebuild.build(transforms, guiMesh, panel.needUpdateGeometry);
                guiMesh.updateGUIData(screenWidth, screenHeight, camera);
                for (const t of transforms) {
                    t.needUpdateQuads = false;
                }
            }

            //calc render order
            let canvas = panel.object3D.getComponentFromParent(GUICanvas);
            let canvasIndex = canvas ? canvas.index : 0;
            guiMesh.uiRenderer.enable = transforms.length > 0;
            let renderStart = panel['isViewPanel'] ? GUIConfig.SortOrderStartView : GUIConfig.SortOrderStartWorld;
            guiMesh.uiRenderer.renderOrder = canvasIndex * GUIConfig.SortOrderCanvasSpan + renderStart + panel.panelOrder;
            //
            guiMesh.uiRenderer.needSortOnCameraZ = panel.needSortOnCameraZ;
            (guiMesh.uiRenderer.material as GUIMaterial).setLimitVertex(guiMesh.limitVertexCount);
            panel.needUpdateGeometry = false;
        }
    }

    public cloneTo(obj: Object3D) {
        let canvas = obj.getOrAddComponent(GUICanvas);
        canvas.copyComponent(this);
    }

    public copyComponent(from: this): this {
        super.copyComponent(from);
        from.index = from.index;
        return this;
    }

}
