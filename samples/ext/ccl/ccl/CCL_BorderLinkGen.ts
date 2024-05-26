export let CCL_BorderLinkGen: string = /*wgsl*/ `

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

    struct BorderLinkAtomicStruct{
      linkIndex:atomic<u32>,
      slot0:u32,
      slot1:u32,
      slot2:u32,
  }

    @group(0) @binding(0) var<uniform> cclUniformData: CCLUniformStruct;
    @group(0) @binding(1) var<storage, read_write> borderLinkAtomic : BorderLinkAtomicStruct ;
    @group(0) @binding(2) var<storage, read_write> cclBuffer : array<f32>;
    @group(0) @binding(3) var<storage, read_write> borderLinkBuffer : array<f32>;
    
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

      if(fragCoord.x > 0){
        processLeftBorder();
      }

      if(fragCoord.y > 0){
        processTopBorder();
      }
    
    }

    fn processLeftBorder()
    {
      for(var i = 0; i < gridCount; i ++){
        let indexCurrent = getIndex(fragCoord.x, fragCoord.y + i);
        let indexBorder = getIndex(fragCoord.x - 1, fragCoord.y + i);
        tryLinkIndex(indexCurrent, indexBorder);
      }
    }

    fn processTopBorder()
    {
      for(var i = 0; i < gridCount; i ++){
        let indexCurrent = getIndex(fragCoord.x + i, fragCoord.y);
        let indexBorder = getIndex(fragCoord.x + i, fragCoord.y - 1);
        tryLinkIndex(indexCurrent, indexBorder);
      }
    }

    fn tryLinkIndex(index0:i32, index1:i32)
    {
      if(index0 > -1 && index1 > -1){
        let labelCurrent = cclBuffer[index0];
        let labelBorder = cclBuffer[index1];
        if(labelCurrent > -0.5 && labelBorder > -0.5 && labelCurrent != labelBorder){
          var fID = atomicAdd(&borderLinkAtomic.linkIndex, 1u);
          fID *= 2u;
          if(labelCurrent > labelBorder){
            borderLinkBuffer[fID] = labelCurrent;
            borderLinkBuffer[fID + 1u] = labelBorder;
          }else{
            borderLinkBuffer[fID] = labelBorder;
            borderLinkBuffer[fID + 1u] = labelCurrent;
          }
        }
      }
    }

    fn getIndex(coordX:i32, coordY:i32) -> i32
    {
      if(coordX < 0 || coordX >= texSizeI32.x || coordY < 0 || coordY >= texSizeI32.y){
        return -1;
      }
      return coordY * texSizeI32.x + coordX;
    }
   

  `