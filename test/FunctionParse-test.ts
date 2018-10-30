import * as FunctionParse from '../lib/FunctionParse';

import * as chai from 'chai';

const expect = chai.expect;

describe('FunctionParse', () => {
  it('parseParams should parse various style functions', () => {
    expect(FunctionParse.parseParams('o => o.a.b.c')).to.deep.equal(['o']);
    expect(FunctionParse.parseParams('(o, s) => o.a.b.c')).to.deep.equal(['o', 's']);
    expect(FunctionParse.parseParams('(o, s1, s2) => return o.a.b.c')).to.deep.equal(['o', 's1', 's2']);
    expect(FunctionParse.parseParams('function(o, $a) { return o.a.b.c; }')).to.deep.equal(['o', '$a']);
    expect(FunctionParse.parseParams('function foo(o, a, b) {\n  return o.a.b.c;\n}')).to.deep.equal(['o', 'a', 'b']);
  });

  it('parseReturnPath should parse various style functions', () => {
    expect(FunctionParse.parseReturnPath('o => o.a.b.c', [])).to.deep.equal(['o', 'a', 'b', 'c']);
    expect(FunctionParse.parseReturnPath('(o, s) => o.a.b.c', [])).to.deep.equal(['o', 'a', 'b', 'c']);
    expect(FunctionParse.parseReturnPath('(o, s) => return o.a.b.c', [])).to.deep.equal(['o', 'a', 'b', 'c']);
    expect(FunctionParse.parseReturnPath('function(o) { return o.a.b.c; }', [])).to.deep.equal(['o', 'a', 'b', 'c']);
    expect(FunctionParse.parseReturnPath('function foo(o) {\n  return o.a.b.c;\n}', [])).to.deep.equal(['o', 'a', 'b', 'c']);
    expect(FunctionParse.parseReturnPath('o => o.a.b[1].c', [])).to.deep.equal(['o', 'a', 'b', 1, 'c']);
  });

  it('parseReturnPath should parse param references', () => {
    expect(FunctionParse.parseReturnPath('(o, s) => o.a.b[s].c', ['s'])).to.deep.equal(['o', 'a', 'b', { paramIdx: 0 }, 'c']);
    expect(FunctionParse.parseReturnPath('(o, $s1, $s2) => o.a[$s1].b[$s2].c', ['$s1', '$s2'])).to.deep.equal(
      ['o', 'a', { paramIdx: 0 }, 'b', { paramIdx: 1 }, 'c']
    );
  });
});
