export function getType(v: any) {
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

export function shallowCloneObject<T>(o: T): T {
  const out: T = {} as any;
  for (const key in o) {
    out[key] = o[key];
  }
  return out;
}

export function shallowCloneArray<T>(a: T, len: number): T {
  const out = new Array(len) as any;
  for (let i = 0; i < len; ++i) {
    out[i] = a[i];
  }
  return out;
}
