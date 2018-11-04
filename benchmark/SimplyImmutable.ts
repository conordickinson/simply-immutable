import { freezeImmutableStructures, replaceImmutable, updateImmutable } from '../lib/Utils';

import { TestSuite } from 'immutable-benchmark-lib/dist/TestSuite';

export class SimplyImmutable extends TestSuite {
  constructor(useFreeze: boolean) {
    super(useFreeze);
  }

  init(initialObject) {
    freezeImmutableStructures(this.useFreeze);
    return super.init(initialObject);
  }
  
  set(obj, key, val) {
    return replaceImmutable(obj, [key], val);
  }
  
  setDeep(obj, key1, key2, val) {
    return replaceImmutable(obj, [key1, key2], val);
  }
  
  setIn(obj, path, val) {
    return replaceImmutable(obj, path, val);
  }
  
  merge(obj1, obj2) {
    return updateImmutable(obj1, [], obj2);
  }
  
  setAt(arr: any[], idx: number, val: any) {
    return replaceImmutable(arr, [idx], val);
  }
  
  setAtDeep(arr: any[][], idx1: number, idx2: number, val: any) {
    return replaceImmutable(arr, [idx1, idx2], val);
  }
}
