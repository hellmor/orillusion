import { Color, ComponentBase, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, View3D } from "..";

export class ToothPlanes extends ComponentBase {

    private _planeTop: Object3D;
    private _planeBottom: Object3D;

    public init(param?: any): void {
        super.init(param);
        this.createPlanes();
    }

    private createPlanes() {
        this._planeTop = this.makePlane(new Color(1, 0, 0, 1)).object3D;
        this.object3D.addChild(this._planeTop);

        this._planeBottom = this.makePlane(new Color(0, 1, 0, 1)).object3D;
        this.object3D.addChild(this._planeBottom);
    }

    private makePlane(color: Color): MeshRenderer {
        let plane = new PlaneGeometry(100, 100);
        let material = new LitMaterial();

        material.baseColor = color;
        let planeObj = new Object3D();

        let renderer = planeObj.addComponent(MeshRenderer);
        renderer.material = material;
        renderer.geometry = plane;
        material.doubleSide = true;

        return renderer;
    }


    private _planeY: { top: number, height: number };
    public setPlanesHeight(data: { top: number, height: number }) {
        this._planeY = data;
    }

    public onUpdate(view?: View3D) {
        if (this._planeY && this._planeBottom && this._planeTop) {
            this._planeTop.y = this._planeY.top;
            this._planeBottom.y = this._planeY.top - this._planeY.height;
        }
    }

    private _planesVisible: boolean = true;
    public get planesVisible(): boolean {
        return this._planesVisible;
    }
    public set planesVisible(value: boolean) {
        this._planesVisible = value;
        if (value) {
            this.object3D.addChild(this._planeTop);
            this.object3D.addChild(this._planeBottom);
        } else {
            this._planeTop.removeSelf();
            this._planeBottom.removeSelf();
        }
    }
}