
export type SerializeTag = null | 'self' | 'non';

export function NonSerialize(cls, key): any {
    let dic = cls['__NonSerialize__'];
    if (!dic) {
        dic = cls['__NonSerialize__'] = {};
        dic['__NonSerialize__'] = true;
    }

    dic[key] = true;
}

export function IsNonSerialize<T extends object>(instance: T, key: keyof T): boolean {
    let noSerializeDic;
    while (instance) {
        instance = instance['__proto__'];
        if (instance) noSerializeDic = instance['__NonSerialize__'];
        if (noSerializeDic) break;
    }
    return noSerializeDic && noSerializeDic[key];
}