export declare class ModifyContext<T> {
    private readonly origData;
    private readonly isOrigMutable;
    private data;
    constructor(origData: T, isOrigMutable: boolean);
    getModifiedData(): Readonly<T>;
    finish(): Readonly<T>;
    replace<V extends T>(value: V): void;
    replace(path: Array<string | number>, value: any): void;
    update<V extends T>(value: V): void;
    update(path: Array<string | number>, value: any): void;
    deepUpdate<V extends T>(value: V): void;
    deepUpdate(path: Array<string | number>, value: any): void;
    applyDiff<V extends T>(value: V): void;
    applyDiff(path: Array<string | number>, value: any): void;
    delete(path: Array<string | number>): void;
    increment(path: Array<string | number>, value: number): Readonly<T>;
    arrayConcat(path: Array<string | number>, values: any[]): Readonly<T>;
    arrayPush(path: Array<string | number>, ...values: any[]): Readonly<T>;
    arrayPop(path: Array<string | number>): Readonly<T>;
    arrayShift(path: Array<string | number>): Readonly<T>;
    arrayUnshift(path: Array<string | number>, ...values: any[]): Readonly<T>;
    arraySlice(path: Array<string | number>, start: number, end?: number): Readonly<T>;
    arraySplice(path: Array<string | number>, index: number, deleteCount: number, ...values: any): Readonly<T>;
}
