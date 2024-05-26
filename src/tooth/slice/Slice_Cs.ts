export let Slice_Cs: string = /*wgsl*/ `
    @group(0) @binding(0) var<storage, read_write> sliceBuffer : array<f32>;
    @group(0) @binding(1) var inTex : texture_2d<f32>;
    @group(0) @binding(2) var outTex : texture_storage_2d<rgba16float, write>;
    
    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = textureDimensions(inTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      var oc = textureLoad(inTex, fragCoord, 0);
      let index = fragCoord.x + fragCoord.y * i32(texSize.x);
      if(oc.r > 0.1){
        sliceBuffer[index] = 1.0;
      }else{
        sliceBuffer[index] = 0.0;
      }
      textureStore(outTex, fragCoord , vec4<f32>(oc.xyz, 1.0));
    }
    
  `