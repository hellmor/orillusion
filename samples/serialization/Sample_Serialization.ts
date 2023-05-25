import { SerializationUtil } from "@orillusion/serialization/SerializationUtil";
import { Object3D } from "../../src";

class Sample_Serialization {
    async run() {
        // let aClass = {
        //     a: 1,
        //     b: "string",
        //     c: true,
        //     d: new Vector2(0, 1),
        //     e: new Vector3(1, 1, 1)
        // };

        // let o = SerializationUtil.serialization(aClass);
        // console.log(o);

        // let bClass = new Vector3();
        // let b = SerializationUtil.serialization(bClass);
        // console.log(b);

        let cClass = new Object3D();
        let c = SerializationUtil.serialization(cClass);
        console.log(c);

    }
}

new Sample_Serialization().run();