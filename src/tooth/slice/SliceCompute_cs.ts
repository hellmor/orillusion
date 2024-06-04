export let Slice_compute_cs: string = /*wgsl*/ `

    struct SliceSetting
    {
      height:f32,
      triangleCount:f32,
      resolutionX:f32,
      resolutionY:f32,

      viewPortWidth:f32,
      viewPortHeight:f32,
      slot0:f32,
      slot1:f32,
    }

    @group(0) @binding(0) var<storage, read_write> outBuffer : array<f32>;
    @group(0) @binding(1) var<storage, read> indexBuffer : array<u32>;
    @group(0) @binding(2) var<storage, read> vertexBuffer : array<f32>;
    @group(0) @binding(3) var<uniform> modelMatrix: mat4x4<f32>;
    @group(0) @binding(4) var<uniform> sliceUniform: SliceSetting;
    // @group(0) @binding(5) var<storage, read_write> largeBuffer : array<f32>;


    var<private> origin:vec3<f32>;
    var<private> direction:vec3<f32> = vec3<f32>(0.0, 1.0, 0.0);
    
    var<private> fragCoord: vec2<i32>;
    
    var<private> hit:vec3<f32>;
    var<private> backfaceHit:bool;

    @compute @workgroup_size( 8, 8, 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      let resolution:vec2<i32> = vec2<i32>(i32(round(sliceUniform.resolutionX)), i32(round(sliceUniform.resolutionY)));
      let index = fragCoord.x + fragCoord.y * i32(resolution.x);
      
      origin.x = f32(globalInvocation_id.x) / sliceUniform.resolutionX - 0.5;
      origin.x *= sliceUniform.viewPortWidth;

      origin.z = f32(globalInvocation_id.y) / sliceUniform.resolutionY - 0.5;
      origin.z *= sliceUniform.viewPortHeight;

      origin.y = -1.0;
      
      let triangleCount = i32(round(sliceUniform.triangleCount));
      var backFaceCount:i32 = 0;
      var frontFaceCount:i32 = 0;
      
      
      var triangleIdx = 0u;
      var hitIndex = 0;
      for(var triangleIdx:i32 = 0; triangleIdx < triangleCount; triangleIdx ++){
        backfaceHit = false;

        let idxOffset = triangleIdx * 3;
        let id0 = indexBuffer[idxOffset    ] * 3;
        let id1 = indexBuffer[idxOffset + 1] * 3;
        let id2 = indexBuffer[idxOffset + 2] * 3;
        
        var v0 = vec3<f32>(vertexBuffer[id0    ], vertexBuffer[id0 + 1], vertexBuffer[id0 + 2]);
        var v1 = vec3<f32>(vertexBuffer[id1 + 3], vertexBuffer[id1 + 4], vertexBuffer[id1 + 5]);
        var v2 = vec3<f32>(vertexBuffer[id2 + 6], vertexBuffer[id2 + 7], vertexBuffer[id2 + 8]);

        v0 = (modelMatrix * vec4<f32>(v0, 1.0)).xyz;
        v1 = (modelMatrix * vec4<f32>(v1, 1.0)).xyz;
        v2 = (modelMatrix * vec4<f32>(v2, 1.0)).xyz;

        if(intersectTriangle(v0, v1, v2)){
          if(hit.y <= sliceUniform.height){
            if(backfaceHit){
              backFaceCount += 1;
            }else{
              frontFaceCount += 1;
            }
          }
          // largeBuffer[index * 128 + hitIndex] = hit.y;
          hitIndex ++;
          // outBuffer[0] = hit.x;
          // outBuffer[1] = hit.y;
          // outBuffer[2] = hit.z;
        }
      }
      let a = outBuffer[0];
      if(frontFaceCount != backFaceCount){
        outBuffer[index] = f32(frontFaceCount - backFaceCount);
      }
    }


    fn intersectTriangle1(v0:vec3<f32>, v1:vec3<f32>, v2:vec3<f32>) -> bool  {

      var _E1: vec3<f32>;
      var _E2: vec3<f32>;
      var _P: vec3<f32>;
      var _T: vec3<f32>;
      var _Q: vec3<f32>;

      // E1s
      _E1 = v1 - v0;

      // E2
      _E2 = v2 - v0;

      // P
      _P = cross(direction, _E2);

      // determinant
      var det = dot(_E1, _P);

      // keep det > 0, modify T accordingly
      if (det > 0.0) {
          backfaceHit = true;
          _T = origin - v0;
      } else {
          _T = v0 - origin;
          det = -det;
      }

      // If determinant is near zero, ray lies in plane of triangle
      if (det < 0.0001){ return false;}

      // Calculate u and make sure u <= 1
      var faceU = dot(_T, _P);
      if (faceU < 0.0 || faceU > det) { return false;}

      // Q
      _Q = cross(_T, _E1);

      // Calculate v and make sure u + v <= 1
      var faceV = dot(direction, _Q);
      if (faceV < 0.0 || faceU + faceV > det) { return false;}
      
      // Calculate t, scale parameters, ray intersects triangle
      var faceT = dot(_E2, _Q);

      var fInvDet = 1.0 / det;
      faceT *= fInvDet;
      faceU *= fInvDet;
      faceV *= fInvDet;

      hit = origin + faceT * direction;
      return true;
  }


    fn intersectTriangle( a:vec3<f32>, b:vec3<f32>, c:vec3<f32>) -> bool 
    {

      // Compute the offset origin, edges, and normal.
  
      // from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h
  
      let _edge1 = b - a;
      let _edge2 = c - a;
      let normal1 = cross(_edge1, _edge2);
  
      // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
      // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
      //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
      //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
      //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
      var DdN = dot(direction, normal1);
      var sign:f32;
  
      if ( DdN > 0.0 ) {
        backfaceHit = true;
        // if ( backfaceCulling ) return false;
        sign = 1.0;
      } else if ( DdN < 0.0 ) {
        sign = - 1.0;
        DdN = - DdN;
  
      } else {
        return false;
      }
  
      let _diff = origin - a;
      let DdQxE2 = sign * dot(direction, cross(_diff, _edge2));
  
      // b1 < 0, no intersection
      if ( DdQxE2 < 0.0 ) {
        return false;
      }
  
      let DdE1xQ = sign * dot(direction, cross(_edge1,  _diff ) );
  
      // b2 < 0, no intersection
      if ( DdE1xQ < 0.0 ) {
        return false;
      }
  
      // b1+b2 > 1, no intersection
      if ( DdQxE2 + DdE1xQ > DdN ) {
        return false;
      }
  
      // Line intersects triangle, check if ray does.
      let QdN = - sign * dot(_diff, normal1 );
  
      // t < 0, no intersection
      if ( QdN < 0.0 ) {
        return false;
      }
  
      // Ray intersects triangle.
      hit = origin + direction * QdN / DdN;
      return true;
    }
    
  `