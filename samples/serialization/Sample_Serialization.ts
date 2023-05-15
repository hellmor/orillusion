import { SerializationUtil, Vector2, Vector3 } from "../../src";

class Sample_Serialization {
    async run() {
        let aClass = {
            a: 1,
            b: "string",
            c: true,
            d: new Vector2(0, 1),
            e: new Vector3(1, 1, 1)
        };

        let o = SerializationUtil.serialization(aClass);
        console.log(o);

    }
}

new Sample_Serialization().run();