import { ComputeShader, ComputeGPUBuffer, View3D, Camera3D, GeometryBase, GlobalBindGroup, GPUContext, Vector3, UniformGPUBuffer, Slice_compute_cs, Vector2, Scene3D, Object3D, Matrix4, append } from "../..";


/**
 * @internal
 * @group IO
 */
export class SliceCompute {
  private _computeShader: ComputeShader;
  public _outBuffer: ComputeGPUBuffer;
  private _modelMatrixUniform: UniformGPUBuffer;
  public _sliceUniform: UniformGPUBuffer;
  public _largeBuffer: ComputeGPUBuffer;
  private _sliceUniformArray: Float32Array;

  // private _orthCamera: Camera3D;

  readonly resolution: Vector2 = new Vector2(2048, 2048);
  public init() {
    this._computeShader = new ComputeShader(Slice_compute_cs);

    let maxCount = this.resolution.x * this.resolution.y;
    let size = Math.ceil(maxCount / 64);
    let workerSizeX = 1024;
    let workerSizeY = Math.ceil(size / workerSizeX);

    console.log('行列', workerSizeX, workerSizeY);

    this._outBuffer = new ComputeGPUBuffer(maxCount);
    this._largeBuffer = new ComputeGPUBuffer(maxCount * 16);

    this._computeShader.setStorageBuffer('outBuffer', this._outBuffer);
    this._computeShader.setStorageBuffer('largeBuffer', this._largeBuffer);
    this._computeShader.workerSizeX = workerSizeX;
    this._computeShader.workerSizeY = workerSizeY;

    this._modelMatrixUniform = new UniformGPUBuffer(16);

    this._sliceUniform = new UniformGPUBuffer(16);
    this._sliceUniformArray = new Float32Array(16);

    return this;
  }

  compute(view: View3D, viewSize: Vector2, modelMatrix: Matrix4, geometry: GeometryBase, worldHeight: number,) {

    // let viewMatrix = this.getOrthCamera(view.scene).viewMatrix;

    this._computeShader.setStorageBuffer('indexBuffer', geometry.indicesBuffer.indicesGPUBuffer);
    this._computeShader.setStorageBuffer('vertexBuffer', geometry.vertexBuffer.vertexGPUBuffer);

    this._modelMatrixUniform.setFloat32Array('data', modelMatrix.rawData);
    this._modelMatrixUniform.apply();
    this._computeShader.setUniformBuffer('modelMatrix', this._modelMatrixUniform);

    let triangleCount = geometry.indicesBuffer.indicesCount / 3;
    this.updateSliceUniform(triangleCount, worldHeight, viewSize, this.resolution);
    this._sliceUniform.setFloat32Array('data', this._sliceUniformArray);
    this._sliceUniform.apply();
    this._computeShader.setUniformBuffer('sliceUniform', this._sliceUniform);



    let command = GPUContext.beginCommandEncoder();
    GPUContext.computeCommand(command, [this._computeShader]);
    GPUContext.endCommandEncoder(command);

    console.log('xxxxxxx');

    // this._outBuffer.readBuffer();
    // let out = this._outBuffer.outFloat32Array;
    // console.log(out[0], out[1], out[2], out[3]);

  }

  // private getOrthCamera(scene: Scene3D): Camera3D {
  //   if (!this._orthCamera) {
  //     this._orthCamera = new Object3D().addComponent(Camera3D);
  //     this._orthCamera.lookAt(new Vector3(0, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1));
  //     scene.addChild(this._orthCamera.object3D);
  //   }
  //   return this._orthCamera;
  // }

  private updateSliceUniform(triangleCount: number, worldHeight: number, viewSize: Vector2, resolution: Vector2) {
    let array = this._sliceUniformArray;
    array[0] = worldHeight;
    array[1] = triangleCount;
    array[2] = resolution.x;
    array[3] = resolution.y;

    array[4] = viewSize.x;
    array[5] = viewSize.y;
    array[6] = 0;
    array[7] = 0;
  }

  /**
   * Returns world position of pick result
   * @returns
   */
  public getPickWorldNormal(target?: Vector3): Float32Array {
    return this._outBuffer.outFloat32Array;
  }

}
