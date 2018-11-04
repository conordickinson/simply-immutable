"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FunctionParse_1 = require("./FunctionParse");
const REMOVE = Symbol('ModifyRemove');
let gUseFreeze = true;
function freezeImmutableStructures(useFreeze) {
    gUseFreeze = useFreeze;
}
exports.freezeImmutableStructures = freezeImmutableStructures;
function getType(v) {
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
function isFrozen(o) {
    try {
        o.___isFrozen___ = 'no';
    }
    catch (err) {
        return true;
    }
    delete o.___isFrozen___;
    return false;
}
exports.isFrozen = isFrozen;
function isDeepFrozen(o) {
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
    }
    else if (type === 'object') {
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
exports.isDeepFrozen = isDeepFrozen;
function shallowClone(o) {
    const out = {};
    for (const key in o) {
        out[key] = o[key];
    }
    return out;
}
function shallowCloneArray(a, len) {
    const out = new Array(len);
    for (let i = 0; i < len; ++i) {
        out[i] = a[i];
    }
    return out;
}
function cmpAndSetOrMerge(dst, src, merge) {
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
        const desiredLength = merge ? Math.max(src.length, dst.length) : src.length;
        if (dst.length !== desiredLength) {
            out = shallowCloneArray(dst, desiredLength);
        }
        for (let i = 0; i < desiredLength; ++i) {
            const newVal = cmpAndSetOrMerge(dst[i], src[i], false);
            if (newVal !== dst[i]) {
                if (out === dst) {
                    out = shallowCloneArray(dst, desiredLength);
                }
                out[i] = newVal;
            }
        }
        if (gUseFreeze && out !== dst) {
            Object.freeze(out);
        }
        return out;
    }
    if (dstType === 'object') {
        let out = dst;
        for (const key in src) {
            const newVal = cmpAndSetOrMerge(dst[key], src[key], false);
            if (newVal !== dst[key]) {
                if (out === dst) {
                    out = shallowClone(dst);
                }
                out[key] = newVal;
            }
        }
        if (!merge) {
            for (const key in dst) {
                if (key in src) {
                    continue;
                }
                if (out === dst) {
                    out = shallowClone(dst);
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
function cmpAndSet(dst, src) {
    return cmpAndSetOrMerge(dst, src, false);
}
function cmpAndMerge(dst, src) {
    return cmpAndSetOrMerge(dst, src, true);
}
function modifyImmutableInternal(root, path, value, updateFunc) {
    const pathLength = path.length;
    const parents = new Array(pathLength);
    const parentTypes = [];
    // walk down the object path, creating intermediate objects/arrays as needed
    let leafVal = root;
    for (let i = 0; i < path.length; ++i) {
        let curType = getType(leafVal);
        const key = path[i];
        if (typeof key === 'number' && curType !== 'array') {
            leafVal = [];
            curType = 'array';
        }
        else if (curType !== 'array' && curType !== 'object') {
            leafVal = {};
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
    let newVal = value === REMOVE ? value : updateFunc(leafVal, value);
    // walk back up the object path, cloning as needed
    for (let i = pathLength - 1; i >= 0; --i) {
        let parent = parents[i];
        const parentType = parentTypes[i];
        const key = path[i];
        if (newVal !== parent[key]) {
            if (parentType === 'array') {
                parent = shallowCloneArray(parent, parent.length);
            }
            else if (parentType === 'object') {
                parent = shallowClone(parent);
            }
            if (newVal === REMOVE) {
                if (parentType === 'array') {
                    parent.splice(key, 1);
                }
                else if (parentType === 'object') {
                    delete parent[key];
                }
            }
            else {
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
function normalizePath(path, paramValues) {
    if (!Array.isArray(path)) {
        const parsedPath = FunctionParse_1.parseFunction(path);
        path = parsedPath.map(p => {
            if (typeof p === 'object' && typeof p.paramIdx === 'number') {
                return paramValues[p.paramIdx];
            }
            return p;
        });
    }
    return path;
}
function replaceImmutable(root, path, value, ...paramValues) {
    return modifyImmutableInternal(root, normalizePath(path, paramValues), value, cmpAndSet);
}
exports.replaceImmutable = replaceImmutable;
function updateImmutable(root, path, value, ...paramValues) {
    return modifyImmutableInternal(root, normalizePath(path, paramValues), value, cmpAndMerge);
}
exports.updateImmutable = updateImmutable;
function deleteImmutable(root, path, ...paramValues) {
    return modifyImmutableInternal(root, normalizePath(path, paramValues), REMOVE, cmpAndSet);
}
exports.deleteImmutable = deleteImmutable;
function cloneImmutable(root) {
    const rootType = getType(root);
    if (rootType === 'array') {
        const copy = shallowCloneArray(root, root.length);
        for (let i = 0; i < copy.length; ++i) {
            copy[i] = cloneImmutable(copy[i]);
        }
        root = gUseFreeze ? Object.freeze(copy) : copy;
    }
    else if (rootType === 'object') {
        const copy = shallowClone(root);
        for (const key in copy) {
            copy[key] = cloneImmutable(copy[key]); // cast needed to remove the Readonly<>
        }
        root = gUseFreeze ? Object.freeze(copy) : copy;
    }
    return root;
}
exports.cloneImmutable = cloneImmutable;
function filterImmutable(val, filter) {
    let out;
    if (Array.isArray(val)) {
        out = val.filter(filter);
    }
    else {
        out = {};
        for (const key in val) {
            if (filter(val[key])) {
                out[key] = val[key];
            }
        }
    }
    return gUseFreeze ? Object.freeze(out) : out;
}
exports.filterImmutable = filterImmutable;
function deepFreeze(o) {
    const type = getType(o);
    if (type === 'object') {
        for (const key in o) {
            deepFreeze(o[key]);
        }
        Object.freeze(o);
    }
    else if (type === 'array') {
        for (let i = 0; i < o.length; ++i) {
            deepFreeze(o[i]);
        }
        Object.freeze(o);
    }
    return o;
}
exports.deepFreeze = deepFreeze;
