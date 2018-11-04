type StashOf<T> = { [key: string]: T };
import { parseFunction } from './FunctionParse';

export const REMOVE = Symbol('ModifyRemove');

type SpecialValues = typeof REMOVE;

type ValueSetter<V> = (v: Readonly<V>) => (Readonly<V> | SpecialValues);
type ValueType<V> = V | SpecialValues | ValueSetter<V>;

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

function cmpAndSet(dst: Readonly<any>, src: Readonly<any>) {
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
    if (dst.length !== src.length) {
      out = dst.slice(0, src.length);
    }
    for (let i = 0; i < src.length; ++i) {
      const newVal = cmpAndSet(dst[i], src[i]);
      if (newVal !== dst[i]) {
        if (out === dst) {
          out = dst.slice(0);
        }
        out[i] = newVal;
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
      const newVal = cmpAndSet(dst[key], src[key]);
      if (newVal !== dst[key]) {
        if (out === dst) {
          out = Object.assign({}, dst);
        }
        out[key] = newVal;
      }
    }
    for (const key in dst) {
      if (key in src) {
        continue;
      }
      if (out === dst) {
        out = Object.assign({}, dst);
      }
      delete out[key];
    }
    if (gUseFreeze && out !== dst) {
      Object.freeze(out);
    }
    return out;
  }

  // simple type
  return src;
}

function modifyImmutableInternal<T>(root: T, path: Array<string|number>, value: any): T {
  const pathLength = path.length;
  const parents: any[] = new Array(pathLength);
  const parentTypes: string[] = [];

  let leafVal = root;
  for (let i = 0; i < path.length; ++i) {
    let curType = getType(leafVal);
    const key = path[i];

    if (typeof key === 'number' && curType !== 'array') {
      root = [] as any as T;
      curType = 'array';
    } else if (curType !== 'array' && curType !== 'object') {
      root = {} as any as T;
      curType = 'object';
    }
    parents[i] = leafVal;
    parentTypes[i] = curType;
    leafVal = leafVal[key];
  }

  if (typeof value === 'function') {
    value = value(leafVal);
  }

  let newVal = value === REMOVE ? value : cmpAndSet(leafVal, value);

  for (let i = pathLength - 1; i >= 0; --i) {
    let parent = parents[i];
    const parentType = parentTypes[i];
    const key = path[i];

    if (newVal !== parent[key]) {
      if (parentType === 'array') {
        parent = (parent as any).slice(0);
      } else if (parentType === 'object') {
        parent = Object.assign({}, parent);
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

export function modifyImmutable<T>(root: Readonly<T>, path: Array<string|number>, value: any): Readonly<T>;
export function modifyImmutable<T, V>(root: Readonly<T>, pathFunc: (root: Readonly<T>) => V, value: ValueType<V>): Readonly<T>;
export function modifyImmutable<T, V, A>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A) => V, value: ValueType<V>, arg0: A): Readonly<T>;
export function modifyImmutable<T, V, A, B>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B) => V, value: ValueType<V>, arg0: A, arg1: B): Readonly<T>;
export function modifyImmutable<T, V, A, B, C>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B, arg2: C) => V, value: ValueType<V>, arg0: A, arg1: B, arg2: C): Readonly<T>;
export function modifyImmutable(root, path, value, ...paramValues) {
  if (Array.isArray(path)) {
    return modifyImmutableInternal(root, path, value);
  }

  const parsedPath = parseFunction(path);
  const realPath = parsedPath.map(p => {
    if (typeof p === 'object' && typeof p.paramIdx === 'number') {
      return paramValues[p.paramIdx];
    }
    return p;
  });
  return modifyImmutableInternal(root, realPath, value);
}

export function cloneImmutable<T>(root: Readonly<T>): Readonly<T> {
  const rootType = getType(root);
  if (rootType === 'array') {
    const copy = (root as any).slice(0) as any[];
    for (let i = 0; i < copy.length; ++i) {
      copy[i] = cloneImmutable(copy[i]);
    }
    root = gUseFreeze ? Object.freeze(copy) as any : copy;
  } else if (rootType === 'object') {
    const copy: T = Object.assign({}, root);
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
