export let CCL_Blend: string = /*wgsl*/ `

    struct CCLUniformStruct{
      plane:vec4<f32>,
      coordX:f32,
      coordY:f32,
      meshID:f32,
      imageWidth:f32,
      imageHeight:f32,
      gridCount:f32,
      activePost:f32,
      slot0:f32,
    } 

    @group(0) @binding(0) var<uniform> selectPlaneColor: vec4<f32>;
    @group(0) @binding(1) var<uniform> cclUniformData: CCLUniformStruct;
    @group(0) @binding(2) var<storage, read_write> cclBuffer : array<f32>;
    @group(0) @binding(3) var<storage, read_write> labelRedirectBuffer : array<f32>;
    @group(0) @binding(4) var colorTex : texture_2d<f32>;
    @group(0) @binding(5) var outTex : texture_storage_2d<rgba16float, write>;

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
      
      if(cclUniformData.activePost > 0.5){
        let index = fragCoord.x + fragCoord.y * i32(texSize.x);
        let pickCoordX = i32(round(cclUniformData.coordX));
        let pickCoordY = i32(round(cclUniformData.coordY));
        var pIndex = pickCoordX + pickCoordY * i32(texSize.x);
        if(isLinked(pIndex, index)){
          var srcColor = wColor.xyz;
          var destColor = selectPlaneColor.xyz;
          destColor = mix(srcColor, destColor, selectPlaneColor.w);

          wColor.x = destColor.x;
          wColor.y = destColor.y;
          wColor.z = destColor.z;
        }
      }
      textureStore(outTex, fragCoord , wColor);
    }

    fn isLinked(pickCoordIdx:i32, currentCoordIdx:i32) -> bool{
      var pickLabel = i32(cclBuffer[pickCoordIdx]);
      if(pickLabel < 0){
        return false;
      }else{
        var currentLabel = i32(cclBuffer[currentCoordIdx]);
        if(pickLabel == currentLabel){
          return true;
        }else{
          if(currentLabel < 0){
            return false;
          }else{
            let pickLabelRedirect = i32(labelRedirectBuffer[pickLabel]);
            if(pickLabelRedirect >= 0){
              pickLabel = pickLabelRedirect;
            }
            let currentLabelRedirect = i32(labelRedirectBuffer[currentLabel]);
            if(currentLabelRedirect >= 0){
              currentLabel = currentLabelRedirect;
            }

            return pickLabel == currentLabel;
          
          }
        }
      }
    }
   

  `