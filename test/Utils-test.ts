import { cloneImmutable, filterImmutable, makeImmutable, modifyImmutable, REMOVE } from '../lib/Utils';

import * as chai from 'chai';

const expect = chai.expect;

type StashOf<T> = { [key: string]: T };
type Stash = StashOf<any>;

function isImmutable(o) {
  try {
    o.___isImmutable___ = 'no';
  } catch (err) {
    return true;
  }
  delete o.___isImmutable___;
  return false;
}

function isImmutableRecursive(o) {
  if (Array.isArray(o)) {
    if (!isImmutable(o)) {
      return false;
    }
    for (let i = 0; i < o.length; ++i) {
      if (!isImmutableRecursive(o[i])) {
        return false;
      }
    }
  } else if (o && typeof o === 'object') {
    if (!isImmutable(o)) {
      return false;
    }
    for (const key in o) {
      if (!isImmutableRecursive(o[key])) {
        return false;
      }
    }
  }
  return true;
}

describe('Utils', () => {
  describe('makeImmutable', () => {
    it('should make objects immutable', () => {
      const obj = { a: 1, b: 2, c: 'hello' };
      expect(isImmutableRecursive(obj)).to.equal(false);
      makeImmutable(obj);
      expect(isImmutableRecursive(obj)).to.equal(true);
    });

    it('should make arrays immutable', () => {
      const arr = [ 1, 2, 'hello' ];
      expect(isImmutableRecursive(arr)).to.equal(false);
      makeImmutable(arr);
      expect(isImmutableRecursive(arr)).to.equal(true);
    });

    it('should work recursively', () => {
      const obj = { a: 1, b: 2, c: [ 1, 2, 3 ], d: { foo: { bar: [ 1, 2, 3] } } };
      expect(isImmutableRecursive(obj)).to.equal(false);
      makeImmutable(obj);
      expect(isImmutableRecursive(obj)).to.equal(true);
      expect(isImmutable(obj.d.foo.bar)).to.equal(true);
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
      expect(isImmutableRecursive(newObj)).to.equal(true);
      expect(isImmutableRecursive(obj)).to.equal(false);
    });

    it('should deep clone arrays and make them recursively immutable', () => {
      const arr = [ 1, [ 2, 3, [4, 5, 6] ] ];
      const newArr = cloneImmutable(arr);
      expect(newArr).to.deep.equal(arr);
      expect(newArr).to.not.equal(arr);
      expect(newArr[1]).to.not.equal(arr[1]);
      expect(newArr[1][2]).to.not.equal(arr[1][2]);
      expect(isImmutableRecursive(newArr)).to.equal(true);
      expect(isImmutableRecursive(arr)).to.equal(false);
    });
  });

  describe('filterImmutable', () => {
    it('should filter objects', () => {
      const obj = makeImmutable({ a: 1, b: { foo: 2 }, c: 2, d: 3, e: { bar: 4 } });
      const newObj = filterImmutable(obj, v => typeof v === 'object');
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ b: { foo: 2 }, e: { bar: 4 } });
      expect(newObj.b).to.equal(obj.b);
      expect(newObj.e).to.equal(obj.e);
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should filter arrays', () => {
      const arr = makeImmutable([1, { foo: 2 }, 2, 3, { bar: 4 }]);
      const newArr = filterImmutable(arr, v => typeof v === 'object');
      expect(newArr).to.not.equal(arr);
      expect(newArr).to.deep.equal([ { foo: 2 }, { bar: 4 } ]);
      expect(newArr[0]).to.equal(arr[1]);
      expect(newArr[1]).to.equal(arr[4]);
      expect(isImmutableRecursive(newArr)).to.equal(true);
    });
  });

  describe('modifyImmutable', () => {
    it('should modify at the root', () => {
      const obj: Stash = makeImmutable({});
      const newObj = modifyImmutable(obj, o => o.foo, [ {} ]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ {} ],
      });
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should add field to object', () => {
      const obj = makeImmutable({ foo: [ {} as Stash ] });
      const newObj = modifyImmutable(obj, o => o.foo[0].bar, 'hello');
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should add element to array', () => {
      const obj = makeImmutable({ foo: [ {} ] });
      const newObj = modifyImmutable(obj, o => o.foo[1], 'hello');
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ {}, 'hello' ],
      });
      expect(newObj.foo[0]).to.equal(obj.foo[0]);
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should ignore simple changes that do not change anything', () => {
      const obj = makeImmutable({ foo: [ { bar: 'hello' } ] });
      const newObj = modifyImmutable(obj, o => o.foo[0].bar, 'hello');
      expect(newObj).to.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should ignore complex changes that do not change anything', () => {
      const obj = makeImmutable({ foo: [ { bar: 'hello' } ] });
      const newObj = modifyImmutable(obj, o => o.foo, [ { bar: 'hello' } ]);
      expect(newObj).to.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should apply minimal change', () => {
      const obj = makeImmutable({ foo: [ { bar: { boz: true } } as Stash ] });
      const newObj = modifyImmutable(obj, o => o.foo, [ { bar: { boz: true }, baz: 'goodbye' } ]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: { boz: true }, baz: 'goodbye' } ],
      });
      expect(newObj.foo[0].bar).to.equal(obj.foo[0].bar);
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should work with function value setter', () => {
      const obj = makeImmutable({ foo: [2] });
      const newObj = modifyImmutable(obj, o => o.foo, v => v.concat(1));
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ 2, 1 ],
      });
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should deep clone objects into the destination', () => {
      const src = makeImmutable({ foo: { bar: { baz: 1 } } });
      const newObj = modifyImmutable({} as Stash, [], src);
      expect(newObj).to.deep.equal(src);
      expect(newObj).to.not.equal(src);
      expect(newObj.foo).to.not.equal(src.foo);
      expect(newObj.foo.bar).to.not.equal(src.foo.bar);
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should deep clone arrays into the destination', () => {
      const src = makeImmutable({ foo: [ [1, 2], [3, 4] ] });
      const newObj = modifyImmutable({} as Stash, [], src);
      expect(newObj).to.deep.equal(src);
      expect(newObj).to.not.equal(src);
      expect(newObj.foo).to.not.equal(src.foo);
      expect(newObj.foo[0]).to.not.equal(src.foo[0]);
      expect(newObj.foo[1]).to.not.equal(src.foo[1]);
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should remove object subfields on update', () => {
      const obj = makeImmutable({ foo: { a: 1, b: 2, c: 3 } as Stash });
      const newObj = modifyImmutable(obj, o => o.foo, { a: 1, c: 3 });
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: { a: 1, c: 3 } });
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should remove object members with REMOVE', () => {
      const obj = makeImmutable({ foo: { a: 1, b: 2, c: 3 } });
      const newObj = modifyImmutable(obj, o => o.foo.b, REMOVE);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: { a: 1, c: 3 } });
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });

    it('should remove array elements with REMOVE', () => {
      const obj = makeImmutable({ foo: [ 1, 2, 3 ] });
      const newObj = modifyImmutable(obj, o => o.foo[1], REMOVE);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({ foo: [1, 3] });
      expect(isImmutableRecursive(newObj)).to.equal(true);
    });
  });
});
