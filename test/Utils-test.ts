import { makeImmutable, modifyImmutable, REMOVE } from '../lib/Utils';

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
    it('should make objects immutable');
    it('should make arrays immutable');
    it('should work recursively');
  });

  describe('cloneImmutable', () => {
    it('should deep clone objects and make them recursively immutable');
    it('should deep clone arrays and make them recursively immutable');
  });

  describe('filterImmutable', () => {
    it('should filter objects');
    it('should filter arrays');
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
