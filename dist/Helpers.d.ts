export declare function getType(v: any): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "null";
export declare function isFrozen(o: any): boolean;
export declare function isDeepFrozen(o: any): boolean;
export declare function shallowCloneObject<T>(o: T): T;
export declare function shallowCloneArray<T>(a: T, len: number): T;
