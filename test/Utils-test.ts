import { cloneImmutable, deleteImmutable, deepFreeze, deepUpdateImmutable, diffImmutable, filterImmutable, isDeepFrozen, isFrozen, replaceImmutable, REMOVE } from '../lib/Utils';

import * as chai from 'chai';

const expect = chai.expect;

type StashOf<T> = { [key: string]: T };
type Stash = StashOf<any>;

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
      const newObj = replaceImmutable({} as Stash, [], src);
      expect(newObj).to.deep.equal(src);
      expect(newObj).to.not.equal(src);
      expect(newObj.foo).to.not.equal(src.foo);
      expect(newObj.foo.bar).to.not.equal(src.foo.bar);
      expect(isDeepFrozen(newObj)).to.equal(true);
    });

    it('should deep clone arrays into the destination', () => {
      const src = deepFreeze({ foo: [ [1, 2], [3, 4] ] });
      const newObj = replaceImmutable({} as Stash, [], src);
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

      const newObj = deepUpdateImmutable(a, [], diff);
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

      const newArr = deepUpdateImmutable(a, [], diff);
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

      const newObj = deepUpdateImmutable(a, [], diff);
      expect(newObj).to.deep.equal(b);
    });
  });
});
