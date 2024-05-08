export let CCL_Blend: string = /*wgsl*/ `

    struct CCLUniformStruct{
      plane:vec4<f32>,
      meshID:f32,
      imageWidth:f32,
      imageHeight:f32,
      slot0:f32,
    } 

    @group(0) @binding(0) var<uniform> cclUniformData: CCLUniformStruct;
    @group(0) @binding(1) var<storage, read_write> cclBuffer : array<f32>;
    @group(0) @binding(2) var colorTex : texture_2d<f32>;
    @group(0) @binding(3) var outTex : texture_storage_2d<rgba16float, write>;

    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    var<private> wColor: vec4<f32>;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = vec2<u32>(u32(cclUniformData.imageWidth), u32(cclUniformData.imageHeight));

      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      wColor = textureLoad(colorTex, fragCoord, 0);
      let index = fragCoord.x + fragCoord.y * i32(texSize.x);
      var label:f32 = cclBuffer[index];
      if(label > -0.5){
        var labelI32 = i32(round(label)) % 3;
        wColor.x = 0.1;
        wColor.y = 0.1;
        wColor.z = 0.1;
        if(labelI32 == 0){
          wColor.x = 0.5;
        }else if(labelI32 == 1){
          wColor.y = 0.5;
        }else{
          wColor.z = 0.5;
        }
      }
      textureStore(outTex, fragCoord , wColor);
    }
   

  `