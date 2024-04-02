import { ComponentBase, View3D } from "../../src";
import { Color } from "../../src/math/Color";
import { Matrix4 } from "../../src/math/Matrix4";
import { Vector3 } from "../../src/math/Vector3";

export class ToothPlatWireframe extends ComponentBase {
    private readonly _geometryPoints: Vector3[] = [];
    private readonly _transformedPoints: Vector3[] = [];
    private _color: Color;
    private _uuid: string;
    private _cachedMatrix1: Matrix4 = new Matrix4().identity();
    private _cachedMatrix2: Matrix4 = new Matrix4().identity();

    public initWireframe(uuid: string, color?: Color) {
        this._uuid = uuid;
        this._color = color || Color.COLOR_WHITE;
    }

    public rebuild(min: Vector3, max: Vector3, maxCol: number, maxRow: number) {
        //clear
        this._geometryPoints.length = 0;
        this._transformedPoints.length = 0;
        this._cachedMatrix1.identity();
        this._cachedMatrix1.rawData.fill(0);//let mt1 != mtx2
        this._cachedMatrix2.identity();

        //make
        let pts = this._geometryPoints;
        for (let col = 0; col <= maxCol; col++) {
            let z = this.mixFloat(min.z, max.z, col / maxCol);
            let from = new Vector3(min.x, min.y, z);
            let to = new Vector3(max.x, min.y, z);
            //bottom grid row
            pts.push(from, to);

            //top
            if (col == 0 || col == maxCol) {
                from = new Vector3(min.x, max.y, z);
                to = new Vector3(max.x, max.y, z);
                pts.push(from, to);
            }
        }
        for (let row = 0; row <= maxRow; row++) {
            let x = this.mixFloat(min.x, max.x, row / maxRow);
            let from = new Vector3(x, min.y, min.z);
            let to = new Vector3(x, min.y, max.z);
            //bottom grid col
            pts.push(from, to);

            //top
            if (row == 0 || row == maxRow) {
                from = new Vector3(x, max.y, min.z);
                to = new Vector3(x, max.y, max.z);
                pts.push(from, to);
            }
        }

        // corner
        let corners: Vector3[] = [];
        corners.push(new Vector3(min.x, min.y, min.z));
        corners.push(new Vector3(min.x, min.y, max.z));
        corners.push(new Vector3(max.x, min.y, min.z));
        corners.push(new Vector3(max.x, min.y, max.z));
        for (let from of corners) {
            let to = from.clone();
            to.y = max.y;
            pts.push(from, to);
        }

        for (let i = 0, c = pts.length; i < c; i++) {
            this._transformedPoints.push(pts[i].clone());
        }
        return this;
    }

    private mixFloat(src: number, dest: number, t: number) {
        return src * (1 - t) + dest * t;
    }

    public onUpdate(view?: View3D) {
        let matrix = this.transform.worldMatrix;
        this.transformBox(matrix);
        let [pts, forceUpdate] = this._transformRet;
        view.graphic3D.createCustomShape(this._uuid).fillShapeData(pts, this._color, forceUpdate);
    }

    private _transformRet: [Vector3[], boolean] = [null, false];
    private transformBox(matrix: Matrix4 = null) {
        if (matrix) this._cachedMatrix2.copyFrom(matrix);
        else this._cachedMatrix2.identity();

        matrix = this._cachedMatrix2;

        let oldMtx = this._cachedMatrix1.rawData;
        let newMtx = matrix.rawData;

        let isChange = false;
        for (let i = 0; i < 16; i++) {
            if (Math.abs(oldMtx[i] - newMtx[i]) > 0.0000001) {
                isChange = true;
                this._cachedMatrix1.copyFrom(matrix);
                break;
            }
        }
        if (isChange) {
            for (let i = 0, c = this._geometryPoints.length; i < c; i++) {
                let src = this._geometryPoints[i];
                let dest = this._transformedPoints[i];
                matrix.transformPoint(src, dest);
            }
        }

        this._transformRet[0] = isChange ? this._transformedPoints : this._geometryPoints;
        this._transformRet[1] = isChange;
    }



}