class CallbackItem {
    target?: any;
    action: Function;
    param?: any;
}

export class CDelegate {
    private readonly _actions: Map<Function, CallbackItem[]> = new Map<Function, CallbackItem[]>();
    public add(action: Function, target?: any, param?: any): boolean {
        let list = this._actions.get(action);
        if (!list) {
            list = [];
            this._actions.set(action, list);
        }
        for (let i = 0, count = list.length; i < count; i++) {
            let item = list[i];
            if (item.action == action && item.target == target) {
                return false;
            }
        }
        let item = { action, target, param };
        list.push(item);
        return true;
    }

    public remove(action: Function, target?: any): boolean {
        let list = this._actions.get(action);
        if (list) {
            for (let i = 0, count = list.length; i < count; i++) {
                let item = list[i];
                if (item.target == target) {
                    list.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }

    public execute(data?: any): this {
        for (let action of this._actions.keys()) {
            let list = this._actions.get(action);
            if (list) {
                for (let item of list) {
                    if (item.target) {
                        item.action.call(item.target, data, item.param);
                    } else {
                        item.action(data, item.param);
                    }
                }
            }
        }
        return this;
    }

    public clear(): this {
        this._actions.clear();
        return this;
    }
}