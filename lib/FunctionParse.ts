type StashOf<T> = { [key: string]: T };

interface ParamIdx { paramIdx: number };
type ParsedFunctionPath = Array<string|number|ParamIdx>;

const gCachedParsed: StashOf<ParsedFunctionPath> = {};

export function parseParams(funcStr: string): string[] {
  let paramStr = '';
  if (funcStr.startsWith('function') || funcStr[0] === '(') {
    const openParenIdx = funcStr.indexOf('(');
    if (openParenIdx < 0) {
      throw new Error('failed to parse function parameters: ' + funcStr);
    }
    paramStr = funcStr.slice(openParenIdx + 1);
    const closeParenIdx = paramStr.indexOf(')');
    if (closeParenIdx < 0) {
      throw new Error('failed to parse function parameters: ' + funcStr);
    }
    paramStr = paramStr.slice(0, closeParenIdx);
  } else {
    paramStr = funcStr.slice(0, funcStr.indexOf('=>'));
  }

  return paramStr.split(',').map(s => s.trim());
}

export function parseReturnPath(funcStr: string, params: string[]): ParsedFunctionPath {
  let retIdx = funcStr.indexOf('return ');
  if (retIdx < 0) {
    retIdx = funcStr.indexOf('=>');
    if (retIdx < 0) {
      throw new Error('failed to parse function return value: ' + funcStr);
    }
    retIdx += 2;
  } else {
    retIdx += 'return '.length;
  }

  let retStr = funcStr.slice(retIdx);
  let termIdx = retStr.indexOf(';');
  if (termIdx < 0) {
    termIdx = retStr.indexOf('\n');
  }
  if (termIdx >= 0) {
    retStr = retStr.slice(0, termIdx);
  }

  const path: ParsedFunctionPath = [];

  while (retStr.length) {
    let endIdx = retStr.length;
    if (retStr[0] === '[') {
      endIdx = retStr.indexOf(']') + 1;
      const innerVal = retStr.slice(1, endIdx - 1);
      const paramIdx = params.indexOf(innerVal);
      if (paramIdx >= 0) {
        path.push({ paramIdx });
      } else {
        const numVal = parseInt(innerVal, 10);
        if (numVal.toString() !== innerVal) {
          throw new Error(`failed to parse return value, unknown param "${innerVal}" found`);
        }
        path.push(numVal);
      }
    } else {
      if (retStr[0] === '.') {
        retStr = retStr.slice(1);
      }
      let dotIdx = retStr.indexOf('.');
      let bracketIdx = retStr.indexOf('[');
      if (dotIdx < 0 && bracketIdx < 0) {
        path.push(retStr.trim());
        retStr = '';
        continue;
      }
      if (dotIdx < 0) {
        dotIdx = Infinity;
      }
      if (bracketIdx < 0) {
        bracketIdx = Infinity;
      }
      endIdx = Math.min(bracketIdx, dotIdx);
      path.push(retStr.slice(0, endIdx).trim());
    }
    retStr = retStr.slice(endIdx);
  }
  
  return path;
}

export function parseFunction(func: any) {
  if (!func.__cachedParsed) {
    const funcStr = func.toString();
    if (!(funcStr in gCachedParsed)) {
      const params = parseParams(funcStr);
      const path = parseReturnPath(funcStr, params.slice(1));
      if (path[0] !== params[0]) {
        throw new Error('failed to parse function; must return a path from the root: ' + funcStr);
      }
      gCachedParsed[funcStr] = path.slice(1);
    }
    func.__cachedParsed = gCachedParsed[funcStr];
  }
  return func.__cachedParsed;
}
