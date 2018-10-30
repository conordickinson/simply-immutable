declare type StashOf<T> = {
    [key: string]: T;
};
export declare const REMOVE: unique symbol;
declare type SpecialValues = typeof REMOVE;
declare type ValueType<V> = V | SpecialValues | ((v: V) => V | SpecialValues);
export declare function modifyImmutable<T>(root: T, path: Array<string | number>, value: any): T;
export declare function modifyImmutable<T, V>(root: T, pathFunc: (root: T) => V, value: ValueType<V>): T;
export declare function modifyImmutable<T, V, A>(root: T, pathFunc: (root: T, arg0: A) => V, value: ValueType<V>, arg0: A): T;
export declare function modifyImmutable<T, V, A, B>(root: T, pathFunc: (root: T, arg0: A, arg1: B) => V, value: ValueType<V>, arg0: A, arg1: B): T;
export declare function modifyImmutable<T, V, A, B, C>(root: T, pathFunc: (root: T, arg0: A, arg1: B, arg2: C) => V, value: ValueType<V>, arg0: A, arg1: B, arg2: C): T;
export declare function cloneImmutable<T>(root: T): T;
export declare function filterImmutable<T>(obj: StashOf<T>, filter: (o: T) => boolean): StashOf<T>;
export declare function filterImmutable<T>(arr: T[], filter: (o: T) => boolean): T[];
export declare function makeImmutable<T>(o: T): T;
export {};
