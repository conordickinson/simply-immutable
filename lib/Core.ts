import { getType, shallowCloneArray, shallowCloneObject } from './Helpers';

export const REMOVE = Symbol('ModifyRemove');

let gUseFreeze = true;

export function freezeImmutableStructures(useFreeze: boolean) {
  gUseFreeze = useFreeze;
}

export function freezeIfEnabled<T>(o: T): T {
  return gUseFreeze ? Object.freeze(o) : o;
}

export function isFreezeEnabled() {
  return gUseFreeze;
}

function cmpAndSetOrMerge(
  dst: Readonly<any>, src: Readonly<any>,
  mergeObjects: boolean, mergeArrays: boolean,
  deepMergeObjects: boolean, deepMergeArrays: boolean,
) {
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
    let desiredLength = mergeArrays ? Math.max(src.length, dst.length) : src.length;
    if (dst.length !== desiredLength) {
      out = shallowCloneArray(dst, desiredLength);
    }
    for (let i = desiredLength - 1; i >= 0; --i) {
      if (mergeArrays && !src.hasOwnProperty(i)) {
        // merge sparse arrays
        continue;
      }
      const newVal = cmpAndSetOrMerge(dst[i], src[i], deepMergeObjects, deepMergeArrays, deepMergeObjects, deepMergeArrays);
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
      const newVal = cmpAndSetOrMerge(dst[key], src[key], deepMergeObjects, deepMergeArrays, deepMergeObjects, deepMergeArrays);
      if (newVal !== dst[key]) {
        if (out === dst) {
          out = shallowCloneObject(dst);
        }
        if (newVal === REMOVE) {
          delete out[key];
        } else {
          out[key] = newVal;
        }
      }
    }
    if (!mergeObjects) {
      for (const key in dst) {
        if (key in src) {
          continue;
        }
        if (out === dst) {
          out = shallowCloneObject(dst);
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

export function cmpAndSet(dst: Readonly<any>, src: Readonly<any>) {
  return cmpAndSetOrMerge(dst, src, false, false, false, false);
}

export function cmpAndMerge(dst: Readonly<any>, src: Readonly<any>) {
  return cmpAndSetOrMerge(dst, src, true, true, false, false);
}

export function cmpAndDeepMerge(dst: Readonly<any>, src: Readonly<any>) {
  return cmpAndSetOrMerge(dst, src, true, true, true, false);
}

export function cmpAndApplyDiff(dst: Readonly<any>, src: Readonly<any>) {
  return cmpAndSetOrMerge(dst, src, true, true, true, true);
}

export function incrementNumber(dst: Readonly<any>, src: Readonly<any>) {
  if (typeof dst !== 'number') {
    return src;
  }
  return dst + (src as unknown as number);
}

export function arrayJoin(dst: Readonly<any>, src: Readonly<any>, atFront: boolean) {
  src = cloneImmutable(src);
  if (!Array.isArray(dst)) {
    return src;
  }
  const out = atFront ? src.concat(dst) : dst.concat(src);
  return gUseFreeze ? Object.freeze(out) : out;
}

export function arraySlice(dst: Readonly<any>, _src: Readonly<any>, params: { start: number, end: number | undefined }) {
  const out = Array.isArray(dst) ? dst.slice(params.start, params.end) : [];
  return gUseFreeze ? Object.freeze(out) : out;
}

export function arraySplice(dst: Readonly<any>, src: Readonly<any>, params: { index: number, deleteCount: number }) {
  src = cloneImmutable(src);
  if (!Array.isArray(dst)) {
    return src;
  }
  const out = dst.slice(0, params.index).concat(src).concat(dst.slice(params.index + params.deleteCount));
  return gUseFreeze ? Object.freeze(out) : out;
}

type UpdateFunc<P> = (dst: Readonly<any>, src: Readonly<any>, param: P) => any;

export function modifyImmutableInternal<T, P>(
  _immutableRoot: T|undefined,
  root: T,
  path: Array<string|number>,
  value: any,
  updateFunc: UpdateFunc<P>,
  updateParam: P,
): T {
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
  let newVal = value === REMOVE ? value : updateFunc(leafVal, value, updateParam);

  // walk back up the object path, cloning as needed
  for (let i = pathLength - 1; i >= 0; --i) {
    let parent = parents[i];
    const parentType = parentTypes[i];
    const key = path[i];

    if (newVal !== parent[key]) {
      if (parentType === 'array') {
        parent = shallowCloneArray(parent, parent.length);
      } else if (parentType === 'object') {
        parent = shallowCloneObject(parent);
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

export function cloneImmutable<T>(root: Readonly<T>): Readonly<T> {
  const rootType = getType(root);
  if (rootType === 'array') {
    const copy = shallowCloneArray(root, (root as any).length) as any;
    for (let i = 0; i < copy.length; ++i) {
      copy[i] = cloneImmutable(copy[i]);
    }
    root = gUseFreeze ? Object.freeze(copy) as any : copy;
  } else if (rootType === 'object') {
    const copy: T = shallowCloneObject(root);
    for (const key in copy) {
      copy[key] = cloneImmutable(copy[key]) as any; // cast needed to remove the Readonly<>
    }
    root = gUseFreeze ? Object.freeze(copy) : copy;
  }
  return root;
}

export function cloneMutable<T>(root: Readonly<T>): T {
  const rootType = getType(root);
  if (rootType === 'array') {
    const copy = shallowCloneArray(root, (root as any).length) as any;
    for (let i = 0; i < copy.length; ++i) {
      copy[i] = cloneMutable(copy[i]);
    }
    root = copy;
  } else if (rootType === 'object') {
    const copy: T = shallowCloneObject(root);
    for (const key in copy) {
      copy[key] = cloneMutable(copy[key]);
    }
    root = copy;
  }
  return root;
}

export function shallowCloneMutable<T>(root: Readonly<T>): T {
  const rootType = getType(root);
  if (rootType === 'array') {
    return shallowCloneArray(root, (root as any).length) as any;
  } else if (rootType === 'object') {
    return shallowCloneObject(root);
  }
  return root;
}
