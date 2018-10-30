"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FunctionParse_1 = require("./FunctionParse");
exports.REMOVE = Symbol('ModifyRemove');
function getType(v) {
    if (Array.isArray(v)) {
        return 'array';
    }
    if (v === null) {
        return 'null';
    }
    return typeof v;
}
function cmpAndSet(dst, src) {
    if (dst === src) {
        return dst;
    }
    const dstType = getType(dst);
    const srcType = getType(src);
    if (dstType !== srcType) {
        if (srcType === 'array' || srcType === 'object') {
            return cloneImmutable(src);
        }
        else {
            return src;
        }
    }
    if (dstType === 'array') {
        let out = dst;
        if (dst.length !== src.length) {
            out = dst.slice(0, src.length);
        }
        for (let i = 0; i < src.length; ++i) {
            const newVal = cmpAndSet(dst[i], src[i]);
            if (newVal !== dst[i]) {
                if (out === dst) {
                    out = dst.slice(0);
                }
                out[i] = newVal;
            }
        }
        if (out !== dst) {
            Object.freeze(out);
        }
        return out;
    }
    if (dstType === 'object') {
        let out = dst;
        for (const key in src) {
            const newVal = cmpAndSet(dst[key], src[key]);
            if (newVal !== dst[key]) {
                if (out === dst) {
                    out = Object.assign({}, dst);
                }
                out[key] = newVal;
            }
        }
        for (const key in dst) {
            if (key in src) {
                continue;
            }
            if (out === dst) {
                out = Object.assign({}, dst);
            }
            delete out[key];
        }
        if (out !== dst) {
            Object.freeze(out);
        }
        return out;
    }
    // simple type
    return src;
}
function modifyImmutableRecur(root, path, value) {
    if (path.length === 0) {
        if (typeof value === 'function') {
            value = value(root);
        }
        if (value === exports.REMOVE) {
            // needs to be handled one level higher
            return value;
        }
        return cmpAndSet(root, value);
    }
    const oldRoot = root;
    const key = path[0];
    const subpath = path.slice(1);
    let rootType = getType(root);
    if (typeof key === 'number' && rootType !== 'array') {
        root = [];
        rootType = 'array';
    }
    else if (rootType !== 'array' && rootType !== 'object') {
        root = {};
        rootType = 'object';
    }
    const oldVal = root[key];
    const newVal = modifyImmutableRecur(oldVal, subpath, value);
    if (newVal !== oldVal) {
        if (rootType === 'array') {
            root = root.slice(0);
        }
        else if (rootType === 'object') {
            root = Object.assign({}, root);
        }
        if (newVal === exports.REMOVE) {
            if (rootType === 'array') {
                root.splice(key, 1);
            }
            else if (rootType === 'object') {
                delete root[key];
            }
        }
        else {
            root[key] = newVal;
        }
    }
    if (root !== oldRoot) {
        Object.freeze(root);
    }
    return root;
}
function modifyImmutable(root, path, value, ...paramValues) {
    if (Array.isArray(path)) {
        return modifyImmutableRecur(root, path, value);
    }
    const parsedPath = FunctionParse_1.parseFunction(path);
    const realPath = parsedPath.map(p => {
        if (typeof p === 'object' && typeof p.paramIdx === 'number') {
            return paramValues[p.paramIdx];
        }
        return p;
    });
    return modifyImmutableRecur(root, realPath, value);
}
exports.modifyImmutable = modifyImmutable;
function cloneImmutable(root) {
    const rootType = getType(root);
    if (rootType === 'array') {
        const copy = root.slice(0);
        for (let i = 0; i < copy.length; ++i) {
            copy[i] = cloneImmutable(copy[i]);
        }
        root = Object.freeze(copy);
    }
    else if (rootType === 'object') {
        const copy = Object.assign({}, root);
        for (const key in copy) {
            copy[key] = cloneImmutable(copy[key]);
        }
        root = Object.freeze(copy);
    }
    return root;
}
exports.cloneImmutable = cloneImmutable;
function filterImmutable(val, filter) {
    if (Array.isArray(val)) {
        return Object.freeze(val.filter(filter));
    }
    else {
        const out = {};
        for (const key in val) {
            if (filter(val[key])) {
                out[key] = val[key];
            }
        }
        return Object.freeze(out);
    }
}
exports.filterImmutable = filterImmutable;
function makeImmutable(o) {
    const type = getType(o);
    if (type === 'object') {
        for (const key in o) {
            makeImmutable(o[key]);
        }
        Object.freeze(o);
    }
    else if (type === 'array') {
        for (let i = 0; i < o.length; ++i) {
            makeImmutable(o[i]);
        }
        Object.freeze(o);
    }
    return o;
}
exports.makeImmutable = makeImmutable;
