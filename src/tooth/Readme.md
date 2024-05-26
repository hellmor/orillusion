# 接口说明

对geometry进行移动缩放平移、底部水平切除、拉底操作。


## 移动缩放平移
输入一个matrix，传入给geometry然后输出新的geometry。得到的Geometry将会被用于裁剪底部多余三角面操作

```ts
let transformer = new ToothModelTransformer(toothGeometry);
//可以使用一个Object3D作为控制器
let controller = new AxisObject(10, 0.2);
let matrix = controller.transform.worldMatrix;
//当matrix调整到合适位置，调用一次函数transform，即可获得输出的output
let retGeometry = transformer.transform(controller.worldMatrix);
```


## 切除多余的三角面
输入一个geometry，然后指定bottom，裁掉y小于bottom三角面。得到的Geometry将会被用于查找边缘、执行拉底操作。

```ts
let clipModel = new ToothClipModel(-50, 50);//设定裁剪位置的上下限
//对clipModel设定裁剪的位置top和拉长height
clipModel.top = 0;
clipModel.height = 20;
//设定完后，执行clip操作(应该为移动缩放平移过的geometry)
 let retGeometry = clipModel.clip(toothGeometry);
```


## 生成边缘和底部平面
输入一个Geometry，指定bottom进行拉伸和填充地图区域操作，获得最终Geometry的列表。
```ts
let clipModel:ToothClipModel;
let bottom = clipModel.top - clipModel.height;
//使用裁切位置的bottom
let retGeometries = new ToothMakeBorder().make(geometry, bottom, true);
let result = retGeometries[0];
 
//如果不想合并geometry，则使用make(geometry, bottom, false);
//将会获得没有合并过的Geometry列表，分别为边缘和底部的geometry
```