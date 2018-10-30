interface ParamIdx {
    paramIdx: number;
}
declare type ParsedFunctionPath = Array<string | number | ParamIdx>;
export declare function parseParams(funcStr: string): string[];
export declare function parseReturnPath(funcStr: string, params: string[]): ParsedFunctionPath;
export declare function parseFunction(func: any): any;
export {};
