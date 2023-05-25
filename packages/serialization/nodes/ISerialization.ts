export interface ISerialization {
    serialize(source: any, obj: any);
    unSerialize(obj: any);
}