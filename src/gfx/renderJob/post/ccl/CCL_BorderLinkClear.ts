export let CCL_BorderLinkClear: string = /*wgsl*/ `

    struct CCLUniformStruct{
      plane:vec4<f32>,
      coordX:f32,
      coordY:f32,
      meshID:f32,
      imageWidth:f32,
      imageHeight:f32,
      gridCount:f32,
      slot0:f32,
      slot1:f32,
    } 

    @group(0) @binding(0) var<uniform> cclUniformData: CCLUniformStruct;
    @group(0) @binding(1) var<storage, read_write> borderLinkBuffer : array<f32>;
    @group(0) @binding(2) var<storage, read_write> labelRedirectBuffer : array<f32>;
    
    var<private> texSize: vec2<u32>;
    var<private> texSizeI32: vec2<i32>;
    var<private> fragCoord: vec2<i32>;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = vec2<u32>(u32(cclUniformData.imageWidth), u32(cclUniformData.imageHeight));
      texSizeI32 = vec2<i32>( texSize );
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      let index = fragCoord.x + fragCoord.y * i32(texSize.x);
      borderLinkBuffer[index * 2] = -1.0;
      borderLinkBuffer[index * 2 + 1] = -1.0;
      labelRedirectBuffer[index] = -1.0;
    }
   

  `