
export class CollisionSetting {
    //是否启用碰撞，可以随时关闭和打开
    //打开时，每帧都会检测，消耗一些性能；关闭后检测停止，碰撞状态不再更新。
    static Enable: boolean = false;


    //初始化碰撞用的Gbuffer尺寸Width，越大越精确，同时性能消耗越多
    //初始化结束后，不能再次修改
    static RTWidth: number = 2048;
    //初始化碰撞用的Gbuffer尺寸Height，越大越精确，同时性能消耗越多
    //初始化结束后，不能再次修改
    static RTHeight: number = 2048;



    //支持最多查询Object3D的数量：设置了meshRenderer的castCollision为true，object3D的数量
    //256是否足够，可以设置为512或者1024
    static QueryMeshCount: number = 256;



    //以下为相机配置（正交），ViewPort对应场景中需要打印对象的AABB的在XZ水平面上的范围
    static ViewPortWidth: number = 120;
    static ViewPortHeight: number = 120;



    //far和near可以不用设置，用默认数据即可
    static CameraFar: number = 5001;
    static CameraNear: number = 1;



    //相机的坐标，XZ设置到需要打印的平台的物体的AABB的中间即可。Y用默认的即可
    static CameraX: number = 0;
    static CameraY: number = 500 + this.CameraNear;
    static CameraZ: number = 0;
}