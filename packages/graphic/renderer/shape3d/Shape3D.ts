import { DynamicDrawStruct, Matrix3, LineJoin, Vector2 } from "@orillusion/core";

export class Shape3DStruct extends DynamicDrawStruct {
    public shapeType: number = 0;
    public shapeOrder: number = 0;
    public destPointStart: number = 0;
    public destPointCount: number = 0;

    public srcPointStart: number = 0;
    public srcPointCount: number = 0;
    public srcIndexStart: number = 0;
    public srcIndexCount: number = 0;

    public empty0: number = 0;
    public empty1: number = 0;
    public uScale: number = 1.0;
    public vScale: number = 1.0;

    public isClosed: number = 0;
    public fill: number = 0;
    public line: number = 0;
    public lineWidth: number = 10;

    public xa: number = 5;
    public xb: number = 4;
    public xc: number = 4;
    public xd: number = 2;

    public xe: number = 5;
    public xf: number = 4;
    public xg: number = 4;
    public xh: number = 2;
}

export enum ShapeTypeEnum {
    None = 0,
    Circle = 1,
    RoundRect = 2,
    Ellipse = 3,
    Line = 4,
}

export class Shape3D {
    protected readonly _shapeStruct: Shape3DStruct;
    protected readonly _sharedSrcIndecies: Uint32Array;
    protected readonly _sharedSrcPoints: Float32Array;
    protected _destPointStart: number = 0;
    protected _destPointCount: number = 0;
    protected _srcPointStart: number = 0;
    protected _srcPointCount: number = 0;
    protected _srcIndexStart: number = 0;
    protected _srcIndexCount: number = 0;
    private _shapeOrder: number = 0;
    protected _points: Vector2[];
    protected _indecies: number[];
    private _uScale: number = 0.1;
    private _vScale: number = 0.1;
    protected _faceCount: number = 0;
    public readonly shapeIndex: number = 0;
    protected _isClosed: boolean = true;
    protected _fill: boolean = true;
    protected _line: boolean = true;
    protected _lineWidth: number = 5;
    protected _isChange: boolean = true;
    public readonly shapeType: number = ShapeTypeEnum.None;

    constructor(structs: Shape3DStruct, srcPoints: Float32Array, srcIndecies: Uint32Array, matrixIndex: number) {
        this._shapeStruct = structs;
        this._sharedSrcPoints = srcPoints;
        this._sharedSrcIndecies = srcIndecies;
        this.shapeIndex = matrixIndex;
    }

    public get isChange() {
        return this._isChange;
    }

    public writeData() {
        this.writeCommonData();
        this.writeShapeData();
        this._isChange = false;
    }

    public get shapeOrder(): number {
        return this._shapeOrder;
    }
    public set shapeOrder(value: number) {
        value = Math.max(0, value);
        if (value != this._shapeOrder) {
            this._isChange = true;
            this._shapeOrder = value;
        }
    }

    public get srcPointStart(): number {
        return this._srcPointStart;
    }
    public set srcPointStart(value: number) {
        if (value != this._srcPointStart) {
            this._isChange = true;
            this._srcPointStart = value;
        }
    }

    public get srcPointCount(): number {
        return this._srcPointCount;
    }

    public get srcIndexStart(): number {
        return this._srcIndexStart;
    }
    public set srcIndexStart(value: number) {
        if (value != this._srcIndexStart) {
            this._isChange = true;
            this._srcIndexStart = value;
        }
    }

    public get srcIndexCount(): number {
        return this._srcIndexCount;
    }

    public get uScale(): number {
        return this._uScale;
    }
    public set uScale(value: number) {
        if (value != this._uScale) {
            this._isChange = true;
            this._uScale = value;
        }
    }
    public get vScale(): number {
        return this._vScale;
    }
    public set vScale(value: number) {
        if (value != this._vScale) {
            this._isChange = true;
            this._vScale = value;
        }
    }

    public get destPointStart(): number {
        return this._destPointStart;
    }
    public set destPointStart(value: number) {
        if (value != this._destPointStart) {
            this._isChange = true;
            this._destPointStart = value;
        }
    }
    public get destPointCount(): number {
        return this._destPointCount;
    }

    public get points(): Vector2[] {
        return this._points;
    }
    public set points(value: Vector2[]) {
        this._points = value;
        this._srcPointCount = value?.length || 0;
        this._isChange = true;
    }

    public get isClosed(): boolean {
        return this._isClosed;
    }
    public set isClosed(value: boolean) {
        if (value != this._isClosed) {
            this._isChange = true;
            this._isClosed = value;
        }
    }

    public get fill(): boolean {
        return this._fill;
    }
    public set fill(value: boolean) {
        if (this._fill != value) {
            this._fill = value;
            this._isChange = true;
        }
    }
    public get line(): boolean {
        return this._line;
    }
    public set line(value: boolean) {
        if (this._line != value) {
            this._line = value;
            this._isChange = true;
        }
    }

    public get lineWidth(): number {
        return this._lineWidth;
    }

    public set lineWidth(value: number) {
        if (this._lineWidth != value) {
            this._lineWidth = Math.max(0, value);
            this._isChange = true;
        }
    }

    public clean() {
        let data = this._shapeStruct;
        for (let key in data) {
            data[key] = 0;
        }
    }

    private writeCommonData() {
        let data = this._shapeStruct;

        data.shapeType = this.shapeType;
        data.shapeOrder = this._shapeOrder;
        data.destPointStart = this._destPointStart;
        data.destPointCount = this._destPointCount;

        data.srcPointStart = this._srcPointStart;
        data.srcPointCount = this._srcPointCount;
        data.srcIndexStart = this._srcIndexStart;
        data.srcIndexCount = this._srcIndexCount;

        // data.empty0 = 0;
        // data.empty1 = 0;
        data.uScale = this._uScale;
        data.vScale = this._vScale;

        data.isClosed = this._isClosed ? 1 : 0;
        data.fill = this._fill ? 1 : 0;
        data.line = this._line ? 1 : 0;
        data.lineWidth = this._lineWidth;

        //write source points
        if (this._srcPointCount) {
            let start = this._srcPointStart * 4;
            let array = this._sharedSrcPoints;
            for (let point of this._points) {
                array[start + 0] = point.x;
                array[start + 1] = point.y;
                start += 4;
            }
        }

        //write source indecies
        if (this._srcIndexCount && this._indecies) {
            let start = this._srcIndexStart * 4;
            let array = this._sharedSrcIndecies;
            for (let i = 0; i < this._srcIndexCount; i++) {
                array[start + 0] = this._indecies[i * 3 + 0];
                array[start + 1] = this._indecies[i * 3 + 1];
                array[start + 2] = this._indecies[i * 3 + 2];
                start += 4;
            }
        }
    }

    protected writeShapeData(a: number = 0, b: number = 0, c: number = 0, d: number = 0, e: number = 0, f: number = 0, g: number = 0, h: number = 0) {
        let data = this._shapeStruct;
        data.xa = a;
        data.xb = b;
        data.xc = c;
        data.xd = d;

        data.xe = e;
        data.xf = f;
        data.xg = g;
        data.xh = h;
    }

    public calcRequireSource() {
        console.warn('Need to calc key points, and faces need to require!');
    }

}