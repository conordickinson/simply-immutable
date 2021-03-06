import {
  applyDiffImmutable,
  arrayConcatImmutable,
  arrayPushImmutable,
  arraySpliceImmutable,
  cloneImmutable,
  cloneMutable,
  deepFreeze,
  deepUpdateImmutable,
  deleteImmutable,
  diffImmutable,
  filterImmutable,
  incrementImmutable,
  isDeepFrozen,
  isFrozen,
  mapImmutable,
  REMOVE,
  replaceImmutable,
  shallowCloneMutable,
  updateImmutable,
  arrayUnshiftImmutable,
  arrayShiftImmutable,
  arrayPopImmutable,
  arraySliceImmutable,
} from '../lib/Utils';

import * as chai from 'chai';

const expect = chai.expect;

type Stash<T = any> = { [key: string]: T };

describe('Utils', () => {
  describe('deepFreeze', () => {
    it('should make objects immutable', () => {
      const obj = { a: 1, b: 2, c: 'hello' };
      expect(isDeepFrozen(obj)).to.equal(false);
      deepFreeze(obj);
      expect(isDeepFrozen(obj)).to.equal(true);
    });

    it('should make arrays immutable', () => {
      const arr = [ 1, 2, 'hello' ];
      expect(isDeepFrozen(arr)).to.equal(false);
      deepFreeze(arr);
      expect(isDeepFrozen(arr)).to.equal(true);
    });

    it('should work recursively', () => {
      const obj = { a: 1, b: 2, c: [ 1, 2, 3 ], d: { foo: { bar: [ 1, 2, 3] } } };
      expect(isDeepFrozen(obj)).to.equal(false);
      deepFreeze(obj);
      expect(isDeepFrozen(obj)).to.equal(true);
      expect(isFrozen(obj.d.foo.bar)).to.equal(true);
    });
  });

  describe('cloneImmutable', () => {
    it('should deep clone objects and make them recursively immutable', () => {
      const obj = { a: { foo: 'bar' }, b: { foo: { baz: { boz: 17 } } } };
      const newObj = cloneImmutable(obj);
      expect(newObj).to.deep.equal(obj);
      expect(newObj).to.not.equal(obj);
      expect(newObj.a).to.not.equal(obj.a);
      expect(newObj.b).to.not.equal(obj.b);
      expect(newObj.b.foo).to.not.equal(obj.b.foo);
      expect(isDeepFrozen(newObj)).to.equal(true);
      expect(isDeepFrozen(obj)).to.equal(false);
    });

    it('should deep clone arrays and make them recursively immutable', () => {
      const arr = [ 1, [ 2, 3, [4, 5, 6] ] ];
      const newArr = cloneImmutable(arr);
      expect(newArr).to.deep.equal(arr);
      expect(newArr).to.not.equal(arr);
      expect(newArr[1]).to.not.equal(arr[1]);
      expect(newArr[1][2]).to.not.equal(arr[1][2]);
      expect(isDeepFrozen(newArr)).to.equal(true);
      expect(isDeepFrozen(arr)).to.equal(false);
    });
  });

  describe('cloneMutable', () => {
    it('should deep clone objects and make them recursively mutable', () => {
      const obj = deepFreeze({ a: { foo: 'bar' }, b: { foo: { baz: { boz: 17 } } } });
      const newObj = cloneMutable(obj);
      expect(newObj).to.deep.equal(obj);
      expect(newObj).to.not.equal(obj);
      expect(newObj.a).to.not.equal(obj.a);
      expect(newObj.b).to.not.equal(obj.b);
      expect(newObj.b.foo).to.not.equal(obj.b.foo);
      expect(isDeepFrozen(newObj)).to.equal(false);
      expect(isDeepFrozen(obj)).to.equal(true);
    });

    it('should deep clone arrays and make them recursively mutable', () => {
      const arr = deepFreeze([ 1, [ 2, 3, [4, 5, 6] ] ]);
      const newArr = cloneMutable(arr);
      expect(newArr).to.deep.equal(arr);
      expect(newArr).to.not.equal(arr);
      expect(newArr[1]).to.not.equal(arr[1]);
      expect(newArr[1][2]).to.not.equal(arr[1][2]);
      expect(isDeepFrozen(newArr)).to.equal(false);
      expect(isDeepFrozen(arr)).to.equal(true);
    });
  });

  describe('shallowCloneMutable', () => {
    it('should deep clone objects and make them mutable', () => {
      const obj = deepFreeze({ a: { foo: 'bar' }, b: { foo: { baz: { boz: 17 } } } });
      const newObj = shallowCloneMutable(obj);
      expect(newObj).to.deep.equal(obj);
      expect(newObj).to.not.equal(obj);
      expect(newObj.a).to.equal(obj.a);
      expect(newObj.b).to.equal(obj.b);
      expect(newObj.b.foo).to.equal(obj.b.foo);
      expect(isDeepFrozen(newObj)).to.equal(false);
      expect(isDeepFrozen(newObj.b)).to.equal(true);
      expect(isDeepFrozen(obj)).to.equal(true);
    });

    it('should deep clone arrays and make them mutable', () => {
      const arr = deepFreeze([ 1, [ 2, 3, [4, 5, 6] ] ]);
      const newArr = shallowCloneMutable(arr);
      expect(newArr).to.deep.equal(arr);
      expect(newArr).to.not.equal(arr);
      expect(newArr[1]).to.equal(arr[1]);
      expect(newArr[1][2]).to.equal(arr[1][2]);
      expect(isDeepFrozen(newArr)).to.equal(false);
      expect(isDeepFrozen(newArr[1])).to.equal(true);
      expect(isDeepFrozen(arr)).to.equal(true);
    });
  });

  describe('filterImmutable', () => {
    it('should filter objects', () => {
      const obj = deepFreeze({ a: 1, b: { foo: 2 }, c: 2, d: 3, e: { bar: 4 } });
      const newObj = filterImmutable(obj, v => typeof v === 'object');
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ b: { foo: 2 }, e: { bar: 4 } });
      expect(newObj.b).to.equal(obj.b);
      expect(newObj.e).to.equal(obj.e);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should filter arrays', () => {
      const arr = deepFreeze([1, { foo: 2 }, 2, 3, { bar: 4 }]);
      const newArr = filterImmutable(arr, v => typeof v === 'object');
      expect(newArr).to.not.equal(arr);
      expect(newArr).to.deep.equal([ { foo: 2 }, { bar: 4 } ]);
      expect(newArr[0]).to.equal(arr[1]);
      expect(newArr[1]).to.equal(arr[4]);
      expect(isDeepFrozen(newArr)).to.equal(true);
    });
  });

  describe('mapImmutable', () => {
    it('should map objects', () => {
      const obj = deepFreeze({ a: 1, b: { foo: 2 }, c: 2, d: 3, e: { bar: 4 } });
      const newObj = mapImmutable(obj as Stash, v => typeof v === 'number' ? v + 1 : v);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ a: 2, b: { foo: 2 }, c: 3, d: 4, e: { bar: 4 } });
      expect(newObj.b).to.equal(obj.b);
      expect(newObj.e).to.equal(obj.e);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should map arrays', () => {
      const arr = deepFreeze([1, { foo: 2 }, 2, 3, { bar: 4 }]);
      const newArr = mapImmutable(arr as any[], v => typeof v === 'number' ? v + 1 : v);
      expect(newArr).to.not.equal(arr);
      expect(newArr).to.deep.equal([2, { foo: 2 }, 3, 4, { bar: 4 }]);
      expect(newArr[1]).to.equal(arr[1]);
      expect(newArr[4]).to.equal(arr[4]);
      expect(isDeepFrozen(newArr)).to.equal(true);
    });
  });

  describe('replaceImmutable', () => {
    it('should modify at the root', () => {
      const obj: Stash = deepFreeze({});
      const newObj = replaceImmutable(obj, o => o.foo, [ {} ]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ {} ],
      });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should add field to object', () => {
      const obj = deepFreeze({ foo: [ {} as Stash ] });
      const newObj = replaceImmutable(obj, o => o.foo[0].bar, 'hello');
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should add element to array', () => {
      const obj = deepFreeze({ foo: [ {} ] });
      const newObj = replaceImmutable(obj, o => o.foo[1], 'hello');
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ {}, 'hello' ],
      });
      expect(newObj.foo[0]).to.equal(obj.foo[0]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should ignore simple changes that do not change anything', () => {
      const obj = deepFreeze({ foo: [ { bar: 'hello' } ] });
      const newObj = replaceImmutable(obj, o => o.foo[0].bar, 'hello');
      expect(newObj).to.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should ignore complex changes that do not change anything', () => {
      const obj = deepFreeze({ foo: [ { bar: 'hello' } ] });
      const newObj = replaceImmutable(obj, o => o.foo, [ { bar: 'hello' } ]);
      expect(newObj).to.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should apply minimal change', () => {
      const obj = deepFreeze({ foo: [ { bar: { boz: true } } as Stash ] });
      const newObj = replaceImmutable(obj, o => o.foo, [ { bar: { boz: true }, baz: 'goodbye' } ]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: { boz: true }, baz: 'goodbye' } ],
      });
      expect(newObj.foo[0].bar).to.equal(obj.foo[0].bar);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should work with function value setter', () => {
      const obj = deepFreeze({ foo: [2] });
      const newObj = replaceImmutable(obj, o => o.foo, v => v.concat(1));
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ 2, 1 ],
      });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should deep clone objects into the destination', () => {
      const src = deepFreeze({ foo: { bar: { baz: 1 } } });
      const newObj = replaceImmutable({}, src);
      expect(newObj).to.deep.equal(src);
      expect(newObj).to.not.equal(src);
      expect(newObj.foo).to.not.equal(src.foo);
      expect(newObj.foo.bar).to.not.equal(src.foo.bar);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should deep clone arrays into the destination', () => {
      const src = deepFreeze({ foo: [ [1, 2], [3, 4] ] });
      const newObj = replaceImmutable({}, src);
      expect(newObj).to.deep.equal(src);
      expect(newObj).to.not.equal(src);
      expect(newObj.foo).to.not.equal(src.foo);
      expect(newObj.foo[0]).to.not.equal(src.foo[0]);
      expect(newObj.foo[1]).to.not.equal(src.foo[1]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should remove object subfields on update', () => {
      const obj = deepFreeze({ foo: { a: 1, b: 2, c: 3 } as Stash });
      const newObj = replaceImmutable(obj, o => o.foo, { a: 1, c: 3 });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: { a: 1, c: 3 } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('updateImmutable', () => {
    it('should merge objects', () => {
      const obj = deepFreeze({ foo: { a: 1, b: 2, c: 3 } as Stash });
      const newObj = updateImmutable(obj, o => o.foo, { a: 2, d: 5 });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: { a: 2, b: 2, c: 3, d: 5 } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should merge arrays', () => {
      const obj = deepFreeze({ foo: [1, 2, 3] });
      const newObj = updateImmutable(obj, o => o.foo, [3, 4]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [3, 4, 3] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should replace below the first level objects', () => {
      const obj = deepFreeze({ a: { aa: 1 }, b: { bb: 2 } });
      const newObj = updateImmutable(obj, { b: { bc: 3 } });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ a: { aa: 1 }, b: { bc: 3 } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('deepUpdateImmutable', () => {
    it('should merge objects', () => {
      const obj = deepFreeze({ foo: { a: 1, b: 2, c: 3 } as Stash });
      const newObj = deepUpdateImmutable(obj, o => o.foo, { a: 2, d: 5 });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: { a: 2, b: 2, c: 3, d: 5 } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should merge arrays', () => {
      const obj = deepFreeze({ foo: [1, 2, 3] });
      const newObj = deepUpdateImmutable(obj, o => o.foo, [3, 4]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [3, 4, 3] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should deep update objects', () => {
      const obj = deepFreeze({ a: { aa: 1 }, b: { bb: 2 } });
      const newObj = deepUpdateImmutable(obj, { b: { bc: 3 } });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ a: { aa: 1 }, b: { bb: 2, bc: 3 } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should replace deep arrays', () => {
      const obj = deepFreeze({ a: { aa: 1 }, b: { bb: [1, 2] } });
      const newObj = deepUpdateImmutable(obj, { b: { bb: [3] } });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ a: { aa: 1 }, b: { bb: [3] } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('deleteImmutable', () => {
    it('should delete object members', () => {
      const obj = deepFreeze({ foo: { a: 1, b: 2, c: 3 } });
      const newObj = deleteImmutable(obj, o => o.foo.b);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: { a: 1, c: 3 } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should delete array elements', () => {
      const obj = deepFreeze({ foo: [ 1, 2, 3 ] });
      const newObj = deleteImmutable(obj, o => o.foo[1]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [1, 3] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('incrementImmutable', () => {
    it('should add to an existing value', () => {
      const obj = deepFreeze({ foo: { a: 1, b: 2, c: 3 } as Stash });
      const newObj = incrementImmutable(obj, ['foo', 'a'], 3);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: { a: 4, b: 2, c: 3 } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should set a non-existent value', () => {
      const obj = deepFreeze({ foo: { a: 1, b: 2, c: 3 } as Stash });
      const newObj = incrementImmutable(obj, ['foo', 'd'], 3);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: { a: 1, b: 2, c: 3, d: 3 } });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('arrayPushImmutable', () => {
    it('should push onto an existing array', () => {
      const obj = deepFreeze({ foo: [ {a: 1}, {a: 2}, {a: 3} ]});
      const newObj = arrayPushImmutable(obj, ['foo'], {a: 4});
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 1}, {a: 2}, {a: 3}, {a: 4} ] });
      expect(newObj.foo[0]).to.equal(obj.foo[0]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should create an array', () => {
      const obj = deepFreeze({});
      const newObj = arrayPushImmutable(obj, ['foo'], { a: 4 });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 4} ] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('arrayConcatImmutable', () => {
    it('should concat onto an existing array', () => {
      const obj = deepFreeze({ foo: [ {a: 1}, {a: 2}, {a: 3} ]});
      const newObj = arrayConcatImmutable(obj, ['foo'], [{a: 4}, {a: 5}]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 1}, {a: 2}, {a: 3}, {a: 4}, {a: 5} ] });
      expect(newObj.foo[0]).to.equal(obj.foo[0]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should create an array', () => {
      const obj = deepFreeze({});
      const newObj = arrayConcatImmutable(obj, ['foo'], [{a: 4}, {a: 5}]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 4}, {a: 5} ] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('arrayUnshiftImmutable', () => {
    it('should unshift onto an existing array', () => {
      const obj = deepFreeze({ foo: [ {a: 1}, {a: 2}, {a: 3} ]});
      const newObj = arrayUnshiftImmutable(obj, ['foo'], {a: 4});
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 4}, {a: 1}, {a: 2}, {a: 3} ] });
      expect(newObj.foo[1]).to.equal(obj.foo[0]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should create an array', () => {
      const obj = deepFreeze({});
      const newObj = arrayUnshiftImmutable(obj, ['foo'], { a: 4 });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 4} ] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('arrayShiftImmutable', () => {
    it('should shift off an existing array', () => {
      const obj = deepFreeze({ foo: [ {a: 1}, {a: 2}, {a: 3} ]});
      const newObj = arrayShiftImmutable(obj, ['foo']);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 2}, {a: 3} ] });
      expect(newObj.foo[0]).to.equal(obj.foo[1]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should create an array', () => {
      const obj = deepFreeze({});
      const newObj = arrayShiftImmutable(obj, ['foo']);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('arrayPopImmutable', () => {
    it('should pop off an existing array', () => {
      const obj = deepFreeze({ foo: [ {a: 1}, {a: 2}, {a: 3} ]});
      const newObj = arrayPopImmutable(obj, ['foo']);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 1}, {a: 2} ] });
      expect(newObj.foo[0]).to.equal(obj.foo[0]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should create an array', () => {
      const obj = deepFreeze({});
      const newObj = arrayPopImmutable(obj, ['foo']);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('arraySliceImmutable', () => {
    it('should slice an existing array', () => {
      const obj = deepFreeze({ foo: [ {a: 1}, {a: 2}, {a: 3}, {a: 4}, {a: 5} ]});
      const newObj = arraySliceImmutable(obj, ['foo'], 2, -1);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 3}, {a: 4} ] });
      expect(newObj.foo[0]).to.equal(obj.foo[2]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should create an array', () => {
      const obj = deepFreeze({});
      const newObj = arraySliceImmutable(obj, ['foo'], 2, 3);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('arraySpliceImmutable', () => {
    it('should splice into an existing array', () => {
      const obj = deepFreeze({ foo: [ {a: 1}, {a: 2}, {a: 3} ]});
      const newObj = arraySpliceImmutable(obj, ['foo'], 1, 1, {a: 4}, {a: 5});
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 1}, {a: 4}, {a: 5}, {a: 3} ] });
      expect(newObj.foo[0]).to.equal(obj.foo[0]);
      expect(newObj.foo[3]).to.equal(obj.foo[2]);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should create an array', () => {
      const obj = deepFreeze({});
      const newObj = arraySpliceImmutable(obj, ['foo'], 1, 1, {a: 4 });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [ {a: 4} ] });
      expect(isDeepFrozen(newObj)).to.equal(true);
    });
  });

  describe('diffImmutable', () => {
    it('should diff objects', () => {
      const a = deepFreeze({ a: 1, b: 2, c: 'foo' });
      const b = deepFreeze({ a: 2, c: 'foo', d: 'goo' });

      const diff = diffImmutable(b, a);
      expect(isDeepFrozen(diff)).to.equal(true);
      expect(diff).to.deep.equal({
        a: 2,
        b: REMOVE,
        d: 'goo',
      });

      const newObj = applyDiffImmutable(a, diff);
      expect(newObj).to.deep.equal(b);
    });
    it('should diff arrays', () => {
      const a = deepFreeze([ 1, 20, 10, 'boo', 'foo' ]);
      const b = deepFreeze([ 1, 15, 10, 'boo' ]);

      const diff = diffImmutable(b, a);
      expect(isDeepFrozen(diff)).to.equal(true);
      expect(diff).to.deep.equal([ undefined, 15, undefined, undefined, REMOVE ]);

      // should be a sparse array:
      expect(diff.hasOwnProperty(0)).to.equal(false);
      expect(diff.hasOwnProperty(1)).to.equal(true);
      expect(diff.hasOwnProperty(2)).to.equal(false);
      expect(diff.hasOwnProperty(3)).to.equal(false);
      expect(diff.hasOwnProperty(4)).to.equal(true);

      const newArr = applyDiffImmutable(a, diff);
      expect(newArr).to.deep.equal(b);
    });
    it('should diff recursively', () => {
      const a = deepFreeze({
        a: 1,
        b: {
          abra: 'cadabra',
          hello: 'goodbye',
        },
        c: 'foo',
        d: [ 'my', 'first', 'array', { foo: 'bar' }],
      });
      let b = replaceImmutable(a, o => o.b.abra, 'bada');
      b = deleteImmutable(b, ['d', 3, 'foo']);
      b = replaceImmutable(b, ['d', 1], 'modified');

      const diff = diffImmutable(b, a);
      expect(isDeepFrozen(diff)).to.equal(true);
      expect(diff).to.deep.equal({
        b: {
          abra: 'bada',
        },
        d: [ undefined, 'modified', undefined, { foo: REMOVE } ],
      });

      const newObj = applyDiffImmutable(a, diff);
      expect(newObj).to.deep.equal(b);
    });
  });
});
