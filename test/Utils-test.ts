import { modifyImmutable } from '../lib/Utils';

import * as chai from 'chai';

const expect = chai.expect;

type StashOf<T> = { [key: string]: T };
type Stash = StashOf<any>;

describe('Utils', () => {
  describe('modifyImmutable', () => {
    it('should modify at the root', () => {
      const obj: Stash = {};
      const newObj = modifyImmutable(obj, o => o.foo, [ {} ]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ {} ],
      });
    });

    it('should add field to object', () => {
      const obj: Stash = { foo: [ {} ] };
      const newObj = modifyImmutable(obj, o => o.foo[0].bar, 'hello');
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
    });

    it('should add field to array', () => {
      const obj: Stash = { foo: [ {} ] };
      const newObj = modifyImmutable(obj, o => o.foo[1], 'hello');
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ {}, 'hello' ],
      });
      expect(newObj.foo[0]).to.equal(obj.foo[0]);
    });

    it('should ignore simple changes that do not change anything', () => {
      const obj = { foo: [ { bar: 'hello' } ] };
      const newObj = modifyImmutable(obj, o => o.foo[0].bar, 'hello');
      expect(newObj).to.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
    });

    it('should ignore complex changes that do not change anything', () => {
      const obj = { foo: [ { bar: 'hello' } ] };
      const newObj = modifyImmutable(obj, o => o.foo, [ { bar: 'hello' } ]);
      expect(newObj).to.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: 'hello' } ],
      });
    });

    it('should apply minimal change', () => {
      const obj: Stash = { foo: [ { bar: { boz: true } } ] };
      const newObj = modifyImmutable(obj, o => o.foo, [ { bar: { boz: true }, baz: 'goodbye' } ]);
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ { bar: { boz: true }, baz: 'goodbye' } ],
      });
      expect(newObj.foo[0].bar).to.equal(obj.foo[0].bar);
    });

    it('should work with function value setter', () => {
      const obj = { foo: [2] };
      const newObj = modifyImmutable(obj, o => o.foo, v => v.concat(1));
      expect(newObj).to.not.equal(obj);
      expect(newObj).to.deep.equal({
        foo: [ 2, 1 ],
      });
    });
  });
});
