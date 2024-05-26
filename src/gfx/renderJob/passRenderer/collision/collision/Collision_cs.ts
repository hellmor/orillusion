export let Collision_process: string = /*wgsl*/ `

    struct CollisionSetting{
      width:f32,
      height:f32,
      maxCount:f32,
      srcCount:f32,
    } 

    @group(0) @binding(0) var<uniform> settingData: CollisionSetting;
    @group(0) @binding(1) var<storage, read_write> srcIds : array<f32>;
    @group(0) @binding(2) var<storage, read_write> dstIds : array<f32>;
    @group(0) @binding(3) var colorTex : texture_2d<f32>;
    @group(0) @binding(4) var copyTex : texture_storage_2d<rgba16float, write>;
    
    var<private> texSize: vec2<u32>;
    var<private> texSizeI32: vec2<i32>;
    var<private> fragCoord: vec2<i32>;
    var<private> curMeshID:i32 = -1;
    var<private> maxCountI32:i32 = 0;
    var<private> wColor:vec4<f32>;
    
    @compute @workgroup_size( 8 , 8, 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {

        fragCoord = vec2<i32>( globalInvocation_id.xy );
        texSize = vec2<u32>(u32(settingData.width), u32(settingData.height));
        texSizeI32 = vec2<i32>( texSize );
        maxCountI32 = i32(round(settingData.maxCount));

        if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
            return;
        }

        wColor =  textureLoad(colorTex, fragCoord, 0);
        textureStore(copyTex, fragCoord , wColor);

        curMeshID = convertMeshID(wColor.w);
       
        if(curMeshID > 0){
            let meshID_label = findLabel(curMeshID);
            //寻找对应的Ids下标
            if(meshID_label >= 0){
                dstIds[meshID_label] = f32(curMeshID);//可见
                var isCollision = getIsCollision();
                if(isCollision){
                    dstIds[meshID_label + maxCountI32] = f32(curMeshID);//碰撞
                }
            }
        }
    }
   
    fn findLabel(meshID:i32) -> i32
    {
        let srcCount = i32(round(settingData.srcCount));
        for(var i:i32 = 0; i < srcCount; i ++){
            if(i32(round(srcIds[i])) == meshID){
                return i;
            }
        }
        return -1;
    }


    fn getIsCollision() -> bool
    {
        if(isEdge(fragCoord.x, fragCoord.y))
        {
            return true;
        }

        for(var i = -1; i < 2; i ++){
            for(var j = -1; j < 2; j ++){
                if(i != 0 && j != 0){
                    var nMeshID = sampleMeshID(fragCoord.x + i, fragCoord.y + j);
                    if(nMeshID > 0 && nMeshID != curMeshID){
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    fn isEdge(coordX:i32, coordY:i32) -> bool
    {
       return coordX <= 0 || (coordX >= texSizeI32.x - 1) || coordY <= 0 || (coordY >= texSizeI32.y - 1);
    }

    fn sampleMeshID(coordX:i32, coordY:i32) -> i32
    {
        let coord = vec2<i32>(coordX, coordY);
        let color = textureLoad(colorTex, coord, 0);
        return convertMeshID(color.w);
    }

    fn convertMeshID(w:f32) -> i32
    {
      return i32(round(w));
    }


    fn getIndex(coordX:i32, coordY:i32) -> i32
    {
      if(coordX < 0 || coordX >= texSizeI32.x || coordY < 0 || coordY >= texSizeI32.y){
        return -1;
      }
      return coordY * texSizeI32.x + coordX;
    }

  `