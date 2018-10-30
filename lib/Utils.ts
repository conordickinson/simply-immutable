type StashOf<T> = { [key: string]: T };
import { parseFunction } from './FunctionParse';

export const REMOVE = Symbol('ModifyRemove');

type SpecialValues = typeof REMOVE;

type ValueType<V> = V | SpecialValues | ((v: V) => V | SpecialValues);


function getType(v: any) {
  if (Array.isArray(v)) {
    return 'array';
  }
  if (v === null) {
    return 'null';
  }
  return typeof v;
}

function cmpAndSet(dst: any, src: any) {
  if (dst === src) {
    return dst;
  }

  const dstType = getType(dst);
  const srcType = getType(src);
  if (dstType !== srcType) {
    if (srcType === 'array') {
      return Object.freeze(src.slice(0));
    } else if (srcType === 'object') {
      return Object.freeze(Object.assign({}, src));
    } else {
      return src;
    }
  }

  if (dstType === 'array') {
    let out = dst;
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
    if (out !== dst) {
      out = Object.freeze(out);
    }
    return out;
  }

  if (dstType === 'object') {
    let out = dst;
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
    if (out !== dst) {
      out = Object.freeze(out);
    }
    return out;
  }

  // simple type
  return src;
}

function modifyImmutableRecur<T>(root: T, path: Array<string|number>, value: any): T {
  if (path.length === 0) {
    if (typeof value === 'function') {
      value = value(root);
    }
    if (value === REMOVE) {
      // needs to be handled one level higher
      return value;
    }
    return cmpAndSet(root, value);
  }

  const oldRoot = root;
  const key = path[0];
  const subpath = path.slice(1);
  let rootType = getType(root);

  if (typeof key === 'number' && rootType !== 'array') {
    root = [] as any as T;
    rootType = 'array';
  } else if (rootType !== 'array' && rootType !== 'object') {
    root = {} as any as T;
    rootType = 'object';
  }

  const oldVal = root[key];
  const newVal = modifyImmutableRecur(oldVal, subpath, value);
  if (newVal !== oldVal) {
    if (rootType === 'array') {
      root = (root as any).slice(0);
    } else if (rootType === 'object') {
      root = Object.assign({}, root);
    }
    if (newVal === REMOVE) {
      if (rootType === 'array') {
        (root as any).splice(key, 1);
      } else if (rootType === 'object') {
        delete root[key];
      }
    } else {
      root[key] = newVal;
    }
  }

  if (root !== oldRoot) {
    root = Object.freeze(root);
  }
  return root;
}

export function modifyImmutable<T>(root: T, path: Array<string|number>, value: any): T;
export function modifyImmutable<T, V>(root: T, pathFunc: (root: T) => V, value: ValueType<V>): T;
export function modifyImmutable<T, V, A>(root: T, pathFunc: (root: T, arg0: A) => V, value: ValueType<V>, arg0: A): T;
export function modifyImmutable<T, V, A, B>(root: T, pathFunc: (root: T, arg0: A, arg1: B) => V, value: ValueType<V>, arg0: A, arg1: B): T;
export function modifyImmutable<T, V, A, B, C>(root: T, pathFunc: (root: T, arg0: A, arg1: B, arg2: C) => V, value: ValueType<V>, arg0: A, arg1: B, arg2: C): T;
export function modifyImmutable(root, path, value, ...paramValues) {
  if (Array.isArray(path)) {
    return modifyImmutableRecur(root, path, value);
  }

  const parsedPath = parseFunction(path);
  const realPath = parsedPath.map(p => {
    if (typeof p === 'object' && typeof p.paramIdx === 'number') {
      return paramValues[p.paramIdx];
    }
    return p;
  });
  return modifyImmutableRecur(root, realPath, value);
}

export function cloneImmutable<T>(root: T): T {
  const rootType = getType(root);
  if (rootType === 'array') {
    const copy = (root as any).slice(0) as any[];
    for (let i = 0; i < copy.length; ++i) {
      copy[i] = cloneImmutable(copy[i]);
    }
    root = Object.freeze(copy) as any;
  } else if (rootType === 'object') {
    const copy = Object.assign({}, root);
    for (const key in copy) {
      copy[key] = cloneImmutable(copy[key]);
    }
    root = Object.freeze(copy);
  }
  return root;
}

export function filterImmutable<T>(obj: StashOf<T>, filter: (o: T) => boolean): StashOf<T>;
export function filterImmutable<T>(arr: T[], filter: (o: T) => boolean): T[];
export function filterImmutable<T>(val: StashOf<T> | T[], filter: (o: T) => boolean): StashOf<T> | T[] {
  if (Array.isArray(val)) {
    return Object.freeze(val.filter(filter)) as T[];
  } else {
    const out: StashOf<T> = {};
    for (const key in val) {
      if (filter(val[key])) {
        out[key] = val[key];
      }
    }
    return Object.freeze(out);
  }
}
