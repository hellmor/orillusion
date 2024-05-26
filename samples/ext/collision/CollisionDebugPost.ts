import {
    View3D,
    webGPUContext,
    PostBase,
    ComputeShader,
    GPUContext,
    GPUTextureFormat,
    RTDescriptor,
    RTFrame,
    RendererPassState,
    VirtualTexture,
    WebGPUDescriptorCreator,
    CollisionPassRenderer,
} from "@orillusion/core";

let Test_cs: string = /*wgsl*/ `

    @group(0) @binding(0) var colorTex : texture_2d<f32>;
    @group(0) @binding(1) var outTex : texture_storage_2d<rgba16float, write>;

    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = textureDimensions(outTex).xy;
      let destTexSize = textureDimensions(colorTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      let uv = vec2<f32>(f32(fragCoord.x) / f32(texSize.x), f32(fragCoord.y) / f32(texSize.y));
      let srcCoord = vec2<i32>( i32(uv.x * f32(destTexSize.x)), i32(uv.y * f32(destTexSize.y)));
      let wColor = textureLoad(colorTex, srcCoord, 0);
      textureStore(outTex, fragCoord , wColor);
    }
  `
export class CollisionDebugPost extends PostBase {
    private outputTexture: VirtualTexture;
    private blendCompute: ComputeShader;
    private rtFrame: RTFrame;
    private rendererPassState: RendererPassState;

    private createCompute() {
        this.blendCompute = new ComputeShader(Test_cs);
        this.blendCompute.setSamplerTexture('colorTex', CollisionPassRenderer.map);
        this.blendCompute.setStorageTexture(`outTex`, this.outputTexture);
    }

    private createResource() {

        let [w, h] = webGPUContext.presentationSize;
        this.outputTexture = new VirtualTexture(w, h, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);
        this.outputTexture.name = 'cTex';
        let collisionDesc = new RTDescriptor();
        collisionDesc.loadOp = `load`;
        this.rtFrame = new RTFrame([this.outputTexture], [collisionDesc]);
    }


    deactiveComputes: ComputeShader[];

    render(view: View3D, command: GPUCommandEncoder) {
        if (!this.blendCompute) {
            this.createResource();
            this.createCompute();
            this.onResize();

            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(this.rtFrame, null);
            this.rendererPassState.label = "Debug";
        }


        this.deactiveComputes = [this.blendCompute];
        GPUContext.computeCommand(command, this.deactiveComputes);
        GPUContext.lastRenderPassState = this.rendererPassState;
    }

    public onResize() {
        let [w, h] = webGPUContext.presentationSize;
        this.outputTexture.resize(w, h);



        let fullWorkerSizeX = Math.ceil(w / 8);
        let fullWorkerSizeY = Math.ceil(h / 8);

        this.blendCompute.workerSizeX = fullWorkerSizeX;
        this.blendCompute.workerSizeY = fullWorkerSizeY;
        this.blendCompute.workerSizeZ = 1;
    }
}