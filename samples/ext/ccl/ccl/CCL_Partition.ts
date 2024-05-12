export let CCL_Partition: string = /*wgsl*/ `

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

    @group(0) @binding(0) var<uniform> cclUniformData: CCLUniformStruct;
    @group(0) @binding(1) var<storage, read_write> cclBuffer : array<f32>;

    var<private> texSize: vec2<u32>;
    var<private> texSizeI32: vec2<i32>;
    var<private> fragCoord: vec2<i32>;
    var<private> gridCount: i32;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      gridCount = i32(cclUniformData.gridCount);
      fragCoord = vec2<i32>( globalInvocation_id.xy ) * gridCount;
      texSize = vec2<u32>(u32(cclUniformData.imageWidth), u32(cclUniformData.imageHeight));
      texSizeI32 = vec2<i32>( texSize );
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }

      var retCount:u32 = 1u;
      while(retCount > 0u){
        retCount = loopAndLabelPartition();
      }
    }


    fn loopAndLabelPartition() -> u32
    {
      var retCount = 0u;
      var tempIndex:i32 = 0;
      var coord:vec2<i32>;
      for(var y:i32 = 0; y < gridCount; y ++){
        for(var x:i32 = 0; x < gridCount; x ++){
          coord.x = fragCoord.x + x;
          coord.y = fragCoord.y + y;
          tempIndex = getIndex(coord.x, coord.y);
          if(tempIndex > -1){
            let currentLabel = cclBuffer[tempIndex];
            if(currentLabel > -0.5){
              let nLabel = getMinNeighborLabel(currentLabel, coord, x, y);
              if(nLabel != currentLabel){
                cclBuffer[tempIndex] = nLabel;
                retCount ++;
              }
            }
          }
        }
      }
      return retCount;
    }

    fn getIndex(coordX:i32, coordY:i32) -> i32
    {
      if(coordX < 0 || coordX >= texSizeI32.x || coordY < 0 || coordY >= texSizeI32.y){
        return -1;
      }
      return coordY * texSizeI32.x + coordX;
    }

    fn getMinNeighborLabel(current:f32, coord:vec2<i32>, lcX:i32, lcY:i32) -> f32
    {
      var targetLabel = current;
      var indexVec4:vec4<i32> = vec4<i32>(-1, -1, -1, -1);

      if(lcX > 0){
        indexVec4.x = getIndex(coord.x - 1, coord.y);//left
      }
      if(lcX < gridCount - 1){
        indexVec4.y = getIndex(coord.x + 1, coord.y);//right
      }
      if(lcY > 0){
        indexVec4.z = getIndex(coord.x, coord.y - 1);//top
      }
      if(lcY < gridCount - 1){
        indexVec4.w = getIndex(coord.x, coord.y + 1);//bottom
      }

      for(var i:u32 = 0u; i < 4u; i ++){
        let index = indexVec4[i];
        if(index > -1){
          var label = cclBuffer[index];
          if(label > -0.5 && label < targetLabel){
            targetLabel = label;
          }
        }
      }

      return targetLabel;
    }
   

  `