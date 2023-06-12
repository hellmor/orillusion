import { Object3D } from "@orillusion/core";
import { IsNonSerialize, NonSerialize } from "../../src/util/SerializeDecoration";

class ComponentBase {
    @NonSerialize public name: string = 'dfdf';
}

class TestComponent extends ComponentBase {
    public UUID: string = 'isdfkl43k4n';
    @NonSerialize public object3D: Object3D;
}

export class Sample_Decorators {
    constructor() {
        let component = new TestComponent();
        for (const key in component) {
            console.log(key, IsNonSerialize(component, key as any));
            // name true
            // uuid undefined
            // bindObject3D true
            // __NoSerialize__ true
        }
    }
}
