type Stash<T = any> = { [key: string]: T };

import { parseFunction } from './FunctionParse';
import { getType } from './Helpers';
import {
  arrayJoin,
  arraySlice,
  arraySplice,
  cmpAndApplyDiff,
  cmpAndDeepMerge,
  cmpAndMerge,
  cmpAndSet,
  freezeIfEnabled,
  incrementNumber,
  modifyImmutableInternal,
  REMOVE,
} from './Core';
import { ModifyContext } from './ModifyContext';

export { cloneImmutable, cloneMutable, freezeImmutableStructures, REMOVE, shallowCloneMutable } from './Core';
export { isDeepFrozen, isFrozen } from './Helpers';

type ValueSetter<V> = (v: Readonly<V>) => Readonly<V>;
type ValueType<V> = V | ValueSetter<V>;

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
  return modifyImmutableInternal(root, root, normalizePath(path, args), value, cmpAndSet, undefined);
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
  return modifyImmutableInternal(root, root, normalizePath(path, args), value, cmpAndMerge, undefined);
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
  return modifyImmutableInternal(root, root, normalizePath(path, args), value, cmpAndDeepMerge, undefined);
}

export function applyDiffImmutable<T, V>(root: Readonly<T>, value: Readonly<V>): Readonly<T & V>;
export function applyDiffImmutable<T>(root: Readonly<T>, path: Array<string|number>, value: any): Readonly<T>;
export function applyDiffImmutable<T, V>(root: Readonly<T>, pathFunc: (root: Readonly<T>) => V, value: ValueType<V>): Readonly<T>;
export function applyDiffImmutable<T, V, A>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A) => V, value: ValueType<V>, arg0: A): Readonly<T>;
export function applyDiffImmutable<T, V, A, B>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B) => V, value: ValueType<V>, arg0: A, arg1: B): Readonly<T>;
export function applyDiffImmutable<T, V, A, B, C>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B, arg2: C) => V, value: ValueType<V>, arg0: A, arg1: B, arg2: C): Readonly<T>;
export function applyDiffImmutable(root, ...args) {
  const path = args.length === 1 ? [] : args.shift();
  const value = args.shift();
  return modifyImmutableInternal(root, root, normalizePath(path, args), value, cmpAndApplyDiff, undefined);
}

export function deleteImmutable<T>(root: Readonly<T>, path: Array<string|number>): Readonly<T>;
export function deleteImmutable<T, V>(root: Readonly<T>, pathFunc: (root: Readonly<T>) => V): Readonly<T>;
export function deleteImmutable<T, V, A>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A) => V, arg0: A): Readonly<T>;
export function deleteImmutable<T, V, A, B>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B) => V, arg0: A, arg1: B): Readonly<T>;
export function deleteImmutable<T, V, A, B, C>(root: Readonly<T>, pathFunc: (root: Readonly<T>, arg0: A, arg1: B, arg2: C) => V, arg0: A, arg1: B, arg2: C): Readonly<T>;
export function deleteImmutable(root, path, ...paramValues) {
  return modifyImmutableInternal(root, root, normalizePath(path, paramValues), REMOVE, cmpAndSet, undefined);
}

export function incrementImmutable<T>(root: Readonly<T>, path: Array<string|number>, value: number): Readonly<T> {
  return modifyImmutableInternal(root, root, path, value, incrementNumber, undefined);
}

export function arrayConcatImmutable<T>(root: Readonly<T>, path: Array<string|number>, values: any[]): Readonly<T> {
  return modifyImmutableInternal(root, root, path, values, arrayJoin, false);
}

export function arrayPushImmutable<T>(root: Readonly<T>, path: Array<string|number>, ...values: any[]): Readonly<T> {
  return modifyImmutableInternal(root, root, path, values, arrayJoin, false);
}

export function arrayPopImmutable<T>(root: Readonly<T>, path: Array<string|number>): Readonly<T> {
  return modifyImmutableInternal(root, root, path, null, arraySlice, { start: 0, end: -1 });
}

export function arrayShiftImmutable<T>(root: Readonly<T>, path: Array<string|number>): Readonly<T> {
  return modifyImmutableInternal(root, root, path, null, arraySlice, { start: 1, end: undefined });
}

export function arrayUnshiftImmutable<T>(root: Readonly<T>, path: Array<string|number>, ...values: any[]): Readonly<T> {
  return modifyImmutableInternal(root, root, path, values, arrayJoin, true);
}

export function arraySliceImmutable<T>(root: Readonly<T>, path: Array<string|number>, start: number, end?: number): Readonly<T> {
  return modifyImmutableInternal(root, root, path, null, arraySlice, { start, end });
}

export function arraySpliceImmutable<T>(root: Readonly<T>, path: Array<string|number>, index: number, deleteCount: number, ...values: any): Readonly<T> {
  return modifyImmutableInternal(root, root, path, values, arraySplice, { index, deleteCount });
}

export function filterImmutable<T>(obj: Readonly<Stash<T>>, filter: (o: Readonly<T>) => boolean): Readonly<Stash<T>>;
export function filterImmutable<T>(arr: Readonly<T[]>, filter: (o: Readonly<T>) => boolean): Readonly<T[]>;
export function filterImmutable<T>(val: Readonly<Stash<T> | T[]>, filter: (o: Readonly<T>) => boolean): Readonly<Stash<T> | T[]> {
  let changed = false;
  let out;

  if (Array.isArray(val)) {
    out = [] as T[];
    for (const v of val) {
      if (filter(v)) {
        out.push(v);
      } else {
        changed = true;
      }
    }
  } else {
    out = {} as Stash<T>;
    for (const key in val) {
      if (filter(val[key])) {
        out[key] = val[key];
      } else {
        changed = true;
      }
    }
  }
  if (!changed) {
    return val;
  }
  return freezeIfEnabled(out);
}

export function mapImmutable<T>(obj: Readonly<Stash<T>>, callback: (val: Readonly<T>, key: string) => T): Readonly<Stash<T>>;
export function mapImmutable<T>(arr: Readonly<T[]>, callback: (val: Readonly<T>, idx: number) => T): Readonly<T[]>;
export function mapImmutable<T>(val: Readonly<Stash<T> | T[]>, callback: (val: Readonly<T>, key: any) => T): Readonly<Stash<T> | T[]> {
  let out;
  if (Array.isArray(val)) {
    out = new Array(val.length) as T[];
    for (let i = 0; i < val.length; ++i) {
      out[i] = callback(val[i], i);
    }
  } else {
    out = {} as Stash<T>;
    for (const key in val) {
      out[key] = callback(val[key], key);
    }
  }
  return replaceImmutable(val as any, out);
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
    return freezeIfEnabled(diff);
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
    return freezeIfEnabled(diff);
  } else {
    return o;
  }
}

export function modifyMultiImmutable<T>(root: Readonly<T>, isMutable = false): ModifyContext<T> {
  return new ModifyContext<T>(root, isMutable);
}
