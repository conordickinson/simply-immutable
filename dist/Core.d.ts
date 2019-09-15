export declare const REMOVE: unique symbol;
export declare function freezeImmutableStructures(useFreeze: boolean): void;
export declare function freezeIfEnabled<T>(o: T): T;
export declare function cmpAndSet(dst: Readonly<any>, src: Readonly<any>): any;
export declare function cmpAndMerge(dst: Readonly<any>, src: Readonly<any>): any;
export declare function cmpAndDeepMerge(dst: Readonly<any>, src: Readonly<any>): any;
export declare function cmpAndApplyDiff(dst: Readonly<any>, src: Readonly<any>): any;
export declare function incrementNumber(dst: Readonly<any>, src: Readonly<any>): number | Readonly<any>;
export declare function arrayJoin(dst: Readonly<any>, src: Readonly<any>, atFront: boolean): any;
export declare function arraySlice(dst: Readonly<any>, _src: Readonly<any>, params: {
    start: number;
    end: number | undefined;
}): readonly any[];
export declare function arraySplice(dst: Readonly<any>, src: Readonly<any>, params: {
    index: number;
    deleteCount: number;
}): Readonly<any>;
declare type UpdateFunc<P> = (dst: Readonly<any>, src: Readonly<any>, param: P) => any;
export declare function modifyImmutableInternal<T, P>(root: T, path: Array<string | number>, value: any, updateFunc: UpdateFunc<P>, updateParam: P): T;
export declare function cloneImmutable<T>(root: Readonly<T>): Readonly<T>;
export declare function cloneMutable<T>(root: Readonly<T>): T;
export declare function shallowCloneMutable<T>(root: Readonly<T>): T;
export {};
