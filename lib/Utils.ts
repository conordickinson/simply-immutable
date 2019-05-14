type StashOf<T> = { [key: string]: T };
import { parseFunction } from './FunctionParse';

export const REMOVE = Symbol('ModifyRemove');

type ValueSetter<V> = (v: Readonly<V>) => Readonly<V>;
type ValueType<V> = V | ValueSetter<V>;

let gUseFreeze = true;

export function freezeImmutableStructures(useFreeze: boolean) {
  gUseFreeze = useFreeze;
}

function getType(v: any) {
  const type = typeof v;
  if (type === 'object') {
    if (Array.isArray(v)) {
      return 'array';
    }
    if (v === null) {
      return 'null';
    }
  }
  return type;
}

export function isFrozen(o: any) {
  try {
    o.___isFrozen___ = 'no';
  } catch (err) {
    return true;
  }
  delete o.___isFrozen___;
  return false;
}

export function isDeepFrozen(o: any) {
  const type = getType(o);
  if (type === 'array') {
    if (!isFrozen(o)) {
      return false;
    }
    for (let i = 0; i < o.length; ++i) {
      if (!isDeepFrozen(o[i])) {
        return false;
      }
    }
  } else if (type === 'object') {
    if (!isFrozen(o)) {
      return false;
    }
    for (const key in o) {
      if (!isDeepFrozen(o[key])) {
        return false;
      }
    }
  }
  return true;
}

function shallowClone<T>(o: T): T {
  const out: T = {} as any;
  for (const key in o) {
    out[key] = o[key];
  }
  return out;
}

function shallowCloneArray<T>(a: T, len: number): T {
  const out = new Array(len) as any;
  for (let i = 0; i < len; ++i) {
    out[i] = a[i];
  }
  return out;
}

function cmpAndSetOrMerge(dst: Readonly<any>, src: Readonly<any>, merge: boolean, deepMerge: boolean) {
  if (dst === src) {
    return dst;
  }

  const dstType = getType(dst);
  const srcType = getType(src);
  if (dstType !== srcType) {
    if (srcType === 'array' || srcType === 'object') {
      return cloneImmutable(src);
    } else {
      return src;
    }
  }

  if (dstType === 'array') {
    let out = dst as any;
    let desiredLength = merge ? Math.max(src.length, dst.length) : src.length;
    if (dst.length !== desiredLength) {
      out = shallowCloneArray(dst, desiredLength);
    }
    for (let i = desiredLength - 1; i >= 0; --i) {
      if (merge && !src.hasOwnProperty(i)) {
        // merge sparse arrays
        continue;
      }
      const newVal = cmpAndSetOrMerge(dst[i], src[i], deepMerge, deepMerge);
      if (newVal !== dst[i]) {
        if (out === dst) {
          out = shallowCloneArray(dst, desiredLength);
        }
        if (newVal === REMOVE) {
          out.splice(i, 1);
          --desiredLength;
        } else {
          out[i] = newVal;
        }
      }
    }
    if (gUseFreeze && out !== dst) {
      Object.freeze(out);
    }
    return out;
  }

  if (dstType === 'object') {
    let out = dst as any;
    for (const key in src) {
      const newVal = cmpAndSetOrMerge(dst[key], src[key], deepMerge, deepMerge);
      if (newVal !== dst[key]) {
        if (out === dst) {
          out = shallowClone(dst);
        }
        if (newVal === REMOVE) {
          delete out[key];
        } else {
          out[key] = newVal;
        }
      }
    }
    if (!merge) {
      for (const key in dst) {
        if (key in src) {
          continue;
        }
        if (out === dst) {
          out = shallowClone(dst);
        }
        delete out[key];
      }
    }
    if (gUseFreeze && out !== dst) {
      Object.freeze(out);
    }
    return out;
  }

  // simple type
  return src;
}

function cmpAndSet(dst: Readonly<any>, src: Readonly<any>) {
  return cmpAndSetOrMerge(dst, src, false, false);
}

function cmpAndMerge(dst: Readonly<any>, src: Readonly<any>) {
  return cmpAndSetOrMerge(dst, src, true, false);
}

function cmpAndDeepMerge(dst: Readonly<any>, src: Readonly<any>) {
  return cmpAndSetOrMerge(dst, src, true, true);
}

type UpdateFunc = (dst: Readonly<any>, src: Readonly<any>) => any;

function modifyImmutableInternal<T>(root: T, path: Array<string|number>, value: any, updateFunc: UpdateFunc): T {
  const pathLength = path.length;
  const parents: any[] = new Array(pathLength);
  const parentTypes: string[] = [];

  // walk down the object path, creating intermediate objects/arrays as needed
  let leafVal = root;
  for (let i = 0; i < path.length; ++i) {
    let curType = getType(leafVal);
    const key = path[i];

    if (typeof key === 'number' && curType !== 'array') {
      if (value === REMOVE) {
        // do NOT create or change intermediate structures if doing a remove operation,
        // just return the existing root because the target does not exist
        return root;
      }
      leafVal = [] as any as T;
      curType = 'array';
    } else if (curType !== 'array' && curType !== 'object') {
      if (value === REMOVE) {
        // do NOT create or change intermediate structures if doing a remove operation,
        // just return the existing root because the target does not exist
        return root;
      }
      leafVal = {} as any as T;
      curType = 'object';
    }
    parents[i] = leafVal;
    parentTypes[i] = curType;
    leafVal = leafVal[key];
  }

  // update the value
  if (typeof value === 'function') {
    value = value(leafVal);
  }
  let newVal = value === REMOVE ? value : updateFunc(leafVal, value);

  // walk back up the object path, cloning as needed
  for (let i = pathLength - 1; i >= 0; --i) {
    let parent = parents[i];
    const parentType = parentTypes[i];
    const key = path[i];

    if (newVal !== parent[key]) {
      if (parentType === 'array') {
        parent = shallowCloneArray(parent, parent.length);
      } else if (parentType === 'object') {
        parent = shallowClone(parent);
      }
      if (newVal === REMOVE) {
        if (parentType === 'array') {
          (parent as any).splice(key, 1);
        } else if (parentType === 'object') {
          delete parent[key];
        }
      } else {
        parent[key] = newVal;
      }
    }

    if (gUseFreeze && parent !== parents[i]) {
      Object.freeze(parent);
    }
    newVal = parent;
  }

  return newVal;
}

function normalizePath(path, paramValues: any[]): string[] {
  if (!Array.isArray(path)) {
    const parsedPath = parseFunction(path);
    path = parsedPath.map(p => {
      if (typeof p === 'object' && typeof p.paramIdx === 'number') {
        return paramValues[p.paramIdx];
      }
      return p;
    });
  }
  return path;
}

// no need for a createImmutable function, since replaceImmutable also handles that case

export function replaceImmutable<T, V extends T>(root: Readonly<T>, value: V): Readonly<T & V>;
export function replaceImmutable<T>(root: Readonly<T>, path: Array<string|number>, value: any): Readonly<T>;
export function replaceImmutable<T, V>(root: Readonly<T>, pathFunc: (root: Readonly<T>) => V, value: ValueType<V>): Readonly<T>;
export function replaceImmutable<T, V, A>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A) => V, value: ValueType<V>, arg0: A): Readonly<T>;
export function replaceImmutable<T, V, A, B>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B) => V, value: ValueType<V>, arg0: A, arg1: B): Readonly<T>;
export function replaceImmutable<T, V, A, B, C>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B, arg2: C) => V, value: ValueType<V>, arg0: A, arg1: B, arg2: C): Readonly<T>;
export function replaceImmutable(root, ...args) {
  const path = args.length === 1 ? [] : args.shift();
  const value = args.shift();
  return modifyImmutableInternal(root, normalizePath(path, args), value, cmpAndSet);
}

export function updateImmutable<T, V>(root: Readonly<T>, value: Readonly<V>): Readonly<T & V>;
export function updateImmutable<T>(root: Readonly<T>, path: Array<string|number>, value: any): Readonly<T>;
export function updateImmutable<T, V>(root: Readonly<T>, pathFunc: (root: Readonly<T>) => V, value: ValueType<V>): Readonly<T>;
export function updateImmutable<T, V, A>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A) => V, value: ValueType<V>, arg0: A): Readonly<T>;
export function updateImmutable<T, V, A, B>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B) => V, value: ValueType<V>, arg0: A, arg1: B): Readonly<T>;
export function updateImmutable<T, V, A, B, C>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B, arg2: C) => V, value: ValueType<V>, arg0: A, arg1: B, arg2: C): Readonly<T>;
export function updateImmutable(root, ...args) {
  const path = args.length === 1 ? [] : args.shift();
  const value = args.shift();
  return modifyImmutableInternal(root, normalizePath(path, args), value, cmpAndMerge);
}

export function deepUpdateImmutable<T, V>(root: Readonly<T>, value: Readonly<V>): Readonly<T & V>;
export function deepUpdateImmutable<T>(root: Readonly<T>, path: Array<string|number>, value: any): Readonly<T>;
export function deepUpdateImmutable<T, V>(root: Readonly<T>, pathFunc: (root: Readonly<T>) => V, value: ValueType<V>): Readonly<T>;
export function deepUpdateImmutable<T, V, A>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A) => V, value: ValueType<V>, arg0: A): Readonly<T>;
export function deepUpdateImmutable<T, V, A, B>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B) => V, value: ValueType<V>, arg0: A, arg1: B): Readonly<T>;
export function deepUpdateImmutable<T, V, A, B, C>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B, arg2: C) => V, value: ValueType<V>, arg0: A, arg1: B, arg2: C): Readonly<T>;
export function deepUpdateImmutable(root, ...args) {
  const path = args.length === 1 ? [] : args.shift();
  const value = args.shift();
  return modifyImmutableInternal(root, normalizePath(path, args), value, cmpAndDeepMerge);
}

export function deleteImmutable<T>(root: Readonly<T>, path: Array<string|number>): Readonly<T>;
export function deleteImmutable<T, V>(root: Readonly<T>, pathFunc: (root: Readonly<T>) => V): Readonly<T>;
export function deleteImmutable<T, V, A>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A) => V, arg0: A): Readonly<T>;
export function deleteImmutable<T, V, A, B>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B) => V, arg0: A, arg1: B): Readonly<T>;
export function deleteImmutable<T, V, A, B, C>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B, arg2: C) => V, arg0: A, arg1: B, arg2: C): Readonly<T>;
export function deleteImmutable(root, path, ...paramValues) {
  return modifyImmutableInternal(root, normalizePath(path, paramValues), REMOVE, cmpAndSet);
}

export function cloneImmutable<T>(root: Readonly<T>): Readonly<T> {
  const rootType = getType(root);
  if (rootType === 'array') {
    const copy = shallowCloneArray(root, (root as any).length) as any;
    for (let i = 0; i < copy.length; ++i) {
      copy[i] = cloneImmutable(copy[i]);
    }
    root = gUseFreeze ? Object.freeze(copy) as any : copy;
  } else if (rootType === 'object') {
    const copy: T = shallowClone(root);
    for (const key in copy) {
      copy[key] = cloneImmutable(copy[key]) as any; // cast needed to remove the Readonly<>
    }
    root = gUseFreeze ? Object.freeze(copy) : copy;
  }
  return root;
}

export function filterImmutable<T>(obj: Readonly<StashOf<T>>, filter: (o: Readonly<T>) => boolean): Readonly<StashOf<T>>;
export function filterImmutable<T>(arr: Readonly<T[]>, filter: (o: Readonly<T>) => boolean): Readonly<T[]>;
export function filterImmutable<T>(val: Readonly<StashOf<T> | T[]>, filter: (o: Readonly<T>) => boolean): Readonly<StashOf<T> | T[]> {
  let out;
  if (Array.isArray(val)) {
    out = val.filter(filter) as T[];
  } else {
    out = {} as StashOf<T>;
    for (const key in val) {
      if (filter(val[key])) {
        out[key] = val[key];
      }
    }
  }
  return gUseFreeze ? Object.freeze(out) : out;
}

export function deepFreeze<T>(o: T): Readonly<T> {
  const type = getType(o);
  if (type === 'object') {
    for (const key in o) {
      deepFreeze(o[key]);
    }
    Object.freeze(o);
  } else if (type === 'array') {
    for (let i = 0; i < (o as any).length; ++i) {
      deepFreeze(o[i]);
    }
    Object.freeze(o);
  }
  return o;
}

export function diffImmutable(oNew: any, oOld: any): undefined | any {
  if (oNew === oOld) {
    return undefined;
  }

  return diffImmutableRecur(oNew, oOld);
}

function diffImmutableRecur(o: any, oOld: any): undefined | any {
  const type = getType(o);
  const typeOld = getType(oOld);

  if (type !== typeOld) {
    return o;
  }

  if (type === 'object') {
    const diff = {};
    for (const key in o) {
      const child = o[key];
      const childOld = oOld[key];
      if (!(key in oOld)) {
        diff[key] = child;
        continue;
      }
      if (child === childOld) {
        continue;
      }
      diff[key] = diffImmutableRecur(child, childOld) as any;
    }
    for (const key in oOld) {
      if (!(key in o)) {
        diff[key] = REMOVE as any;
      }
    }
    return gUseFreeze ? Object.freeze(diff) : diff;
  } else if (type === 'array') {
    const a = o as any as any[];
    const aOld = oOld as any as any[];
    const diff: any[] = [];
    for (let i = 0; i < a.length; ++i) {
      if (i >= aOld.length) {
        diff[i] = a[i];
      } else if (a[i] !== aOld[i]) {
        diff[i] = diffImmutableRecur(a[i], aOld[i]);
      }
    }
    for (let i = a.length; i < aOld.length; ++i) {
      diff[i] = REMOVE;
    }
    return gUseFreeze ? Object.freeze(diff) : diff;
  } else {
    return o;
  }
}
