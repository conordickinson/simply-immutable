declare type StashOf<T> = {
    [key: string]: T;
};
export declare const REMOVE: unique symbol;
declare type SpecialValues = typeof REMOVE;
declare type ValueSetter<V> = (v: Readonly<V>) => (Readonly<V> | SpecialValues);
declare type ValueType<V> = V | SpecialValues | ValueSetter<V>;
export declare function modifyImmutable<T>(root: Readonly<T>, path: Array<string | number>, value: any): Readonly<T>;
export declare function modifyImmutable<T, V>(root: Readonly<T>, pathFunc: (root: Readonly<T>) => V, value: ValueType<V>): Readonly<T>;
export declare function modifyImmutable<T, V, A>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A) => V, value: ValueType<V>, arg0: A): Readonly<T>;
export declare function modifyImmutable<T, V, A, B>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B) => V, value: ValueType<V>, arg0: A, arg1: B): Readonly<T>;
export declare function modifyImmutable<T, V, A, B, C>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B, arg2: C) => V, value: ValueType<V>, arg0: A, arg1: B, arg2: C): Readonly<T>;
export declare function cloneImmutable<T>(root: Readonly<T>): Readonly<T>;
export declare function filterImmutable<T>(obj: Readonly<StashOf<T>>, filter: (o: Readonly<T>) => boolean): Readonly<StashOf<T>>;
export declare function filterImmutable<T>(arr: Readonly<T[]>, filter: (o: Readonly<T>) => boolean): Readonly<T[]>;
export declare function makeImmutable<T>(o: T): Readonly<T>;
export {};
