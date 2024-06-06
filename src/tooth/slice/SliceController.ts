import { Color, ComponentBase, ComputeGPUBuffer, Engine3D, MeshRenderer, Object3D, PlaneGeometry, SliceDataReader, SliceImageData, ToothClipTag, StencilSliceMaterial, UnLitMaterial, Vector3, clamp } from "../..";

export class SliceController extends ComponentBase {

    sliceBuffer: ComputeGPUBuffer;
    sliceDataReader: SliceDataReader;
    sliceDataMap: Map<number, SliceImageData>;

    up: Vector3 = Vector3.UP;
    position: Vector3 = new Vector3();
    material: StencilSliceMaterial;
    maxIndex: number;
    planeObj: Object3D;

    indexOffset: number = 0.01;
    private _sliceIndex: number = -99;
    public get sliceIndex(): number {
        return this._sliceIndex;
    }

    public get isReading() {
        return this.sliceDataReader.isReading;
    }

    public set sliceIndex(value: number) {
        if (this._sliceIndex != value) {
            this._sliceIndex = value;
            this.planeObj.localPosition = new Vector3(0, value + this.indexOffset, 0);

            this.material.setClipPosition(value + this.indexOffset);
        }
    }

    /**
     *
     *
     * @param {ComputeGPUBuffer} sliceBuffer 读取buffer的数据源
     * @param {StencilSliceMaterial} material clip牙齿的材质球
     * @param {number} maxIndex 切片最大层数，将从0~maxIndex逐层处理。一共切100次。
     * @param {number} [indexOffset=0.5] 放置plane的时候，给到半个精度偏移量。放置的模型，在切片层数为0位置由于顶点数据的y都是0，可能会导致没有实心像素点生成。
     * @memberof SliceController
     */
    public initController(sliceBuffer: ComputeGPUBuffer, material: StencilSliceMaterial, maxIndex: number, indexOffset: number = 0.5) {
        this.maxIndex = maxIndex;
        this.indexOffset = indexOffset;
        this.sliceBuffer = sliceBuffer;
        this.material = material;

        this.material.setClipEnable(ToothClipTag.Negative);

        this.sliceDataReader = new SliceDataReader();
        this.sliceDataMap = new Map<number, SliceImageData>();
        this.sliceDataReader.callback.add(this.onDataReadSuccess, this);

        this.planeObj = this.initPlane();
    }

    initPlane() {
        let plane = new Object3D();
        let renderer = plane.addComponent(MeshRenderer);
        let geometry = new PlaneGeometry(4096, 4096);
        let material = new UnLitMaterial();
        material.baseColor = new Color(1, 0, 0, 1);
        material.castShadow = false;
        material.acceptShadow = false;
        material.doubleSide = true;

        let depthStencil: GPUDepthStencilState = {
            depthWriteEnabled: false,
            depthCompare: 'always',
            stencilWriteMask: 0xFFFFFFFF,
            stencilReadMask: 0xFFFFFFFF,
            stencilBack: { compare: "not-equal", failOp: 'replace', passOp: 'replace', depthFailOp: 'replace' },
            stencilFront: { compare: "not-equal", failOp: 'replace', passOp: 'replace', depthFailOp: 'replace' }
        } as any;
        material.shader.getDefaultColorShader().depthStencil = depthStencil;
        renderer.geometry = geometry;
        renderer.material = material;
        Engine3D.views[0].scene.addChild(plane);
        return plane;
    }

    private onDataReadSuccess(image: SliceImageData) {
        this.sliceDataMap.set(image.index, image);

        //todo 异步操作：在这里做传输image数据到外部，回调函数执行下一层切片
        console.log('==>读取层数', image.index, '红点数量', image.count, '/', image.array.length);
        //
        setTimeout(() => {
            console.log('<==传输层数', image.index, ' 传输成功');
            Engine3D.resume();
            if (image.index >= this.maxIndex - 1) {
                console.log('切片完毕');
            } else {
                //切下一层
                let newIndex = clamp(image.index + 1, 0, this.maxIndex - 1);
                this.sliceIndex = newIndex;
            }
        }, 1);
    }

    public start(): void {
        this.sliceIndex = 0;
    }

    public lateEngineRender() {
        if (this._sliceIndex >= 0 && !this.sliceDataMap.has(this._sliceIndex)) {
            Engine3D.pause();
            this.sliceDataReader.readBuffer(this.sliceBuffer, this._sliceIndex);
        }
    }
}