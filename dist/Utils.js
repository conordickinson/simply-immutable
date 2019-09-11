"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FunctionParse_1 = require("./FunctionParse");
exports.REMOVE = Symbol('ModifyRemove');
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
function shallowCloneObject(o) {
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
function cmpAndSetOrMerge(dst, src, mergeObjects, mergeArrays, deepMergeObjects, deepMergeArrays) {
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
        let desiredLength = mergeArrays ? Math.max(src.length, dst.length) : src.length;
        if (dst.length !== desiredLength) {
            out = shallowCloneArray(dst, desiredLength);
        }
        for (let i = desiredLength - 1; i >= 0; --i) {
            if (mergeArrays && !src.hasOwnProperty(i)) {
                // merge sparse arrays
                continue;
            }
            const newVal = cmpAndSetOrMerge(dst[i], src[i], deepMergeObjects, deepMergeArrays, deepMergeObjects, deepMergeArrays);
            if (newVal !== dst[i]) {
                if (out === dst) {
                    out = shallowCloneArray(dst, desiredLength);
                }
                if (newVal === exports.REMOVE) {
                    out.splice(i, 1);
                    --desiredLength;
                }
                else {
                    out[i] = newVal;
                }
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
            const newVal = cmpAndSetOrMerge(dst[key], src[key], deepMergeObjects, deepMergeArrays, deepMergeObjects, deepMergeArrays);
            if (newVal !== dst[key]) {
                if (out === dst) {
                    out = shallowCloneObject(dst);
                }
                if (newVal === exports.REMOVE) {
                    delete out[key];
                }
                else {
                    out[key] = newVal;
                }
            }
        }
        if (!mergeObjects) {
            for (const key in dst) {
                if (key in src) {
                    continue;
                }
                if (out === dst) {
                    out = shallowCloneObject(dst);
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
    return cmpAndSetOrMerge(dst, src, false, false, false, false);
}
function cmpAndMerge(dst, src) {
    return cmpAndSetOrMerge(dst, src, true, true, false, false);
}
function cmpAndDeepMerge(dst, src) {
    return cmpAndSetOrMerge(dst, src, true, true, true, false);
}
function cmpAndApplyDiff(dst, src) {
    return cmpAndSetOrMerge(dst, src, true, true, true, true);
}
function incrementNumber(dst, src) {
    if (typeof dst !== 'number') {
        return src;
    }
    return dst + src;
}
function arrayConcat(dst, src) {
    src = cloneImmutable(src);
    if (!Array.isArray(dst)) {
        return src;
    }
    const out = dst.concat(src);
    return gUseFreeze ? Object.freeze(out) : out;
}
function arraySplice(dst, src, params) {
    src = cloneImmutable(src);
    if (!Array.isArray(dst)) {
        return src;
    }
    const out = dst.slice(0, params.index).concat(src).concat(dst.slice(params.index + params.deleteCount));
    return gUseFreeze ? Object.freeze(out) : out;
}
function modifyImmutableInternal(root, path, value, updateFunc, updateParam) {
    const pathLength = path.length;
    const parents = new Array(pathLength);
    const parentTypes = [];
    // walk down the object path, creating intermediate objects/arrays as needed
    let leafVal = root;
    for (let i = 0; i < path.length; ++i) {
        let curType = getType(leafVal);
        const key = path[i];
        if (typeof key === 'number' && curType !== 'array') {
            if (value === exports.REMOVE) {
                // do NOT create or change intermediate structures if doing a remove operation,
                // just return the existing root because the target does not exist
                return root;
            }
            leafVal = [];
            curType = 'array';
        }
        else if (curType !== 'array' && curType !== 'object') {
            if (value === exports.REMOVE) {
                // do NOT create or change intermediate structures if doing a remove operation,
                // just return the existing root because the target does not exist
                return root;
            }
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
    let newVal = value === exports.REMOVE ? value : updateFunc(leafVal, value, updateParam);
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
                parent = shallowCloneObject(parent);
            }
            if (newVal === exports.REMOVE) {
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
function replaceImmutable(root, ...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    return modifyImmutableInternal(root, normalizePath(path, args), value, cmpAndSet, undefined);
}
exports.replaceImmutable = replaceImmutable;
function updateImmutable(root, ...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    return modifyImmutableInternal(root, normalizePath(path, args), value, cmpAndMerge, undefined);
}
exports.updateImmutable = updateImmutable;
function deepUpdateImmutable(root, ...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    return modifyImmutableInternal(root, normalizePath(path, args), value, cmpAndDeepMerge, undefined);
}
exports.deepUpdateImmutable = deepUpdateImmutable;
function applyDiffImmutable(root, ...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    return modifyImmutableInternal(root, normalizePath(path, args), value, cmpAndApplyDiff, undefined);
}
exports.applyDiffImmutable = applyDiffImmutable;
function deleteImmutable(root, path, ...paramValues) {
    return modifyImmutableInternal(root, normalizePath(path, paramValues), exports.REMOVE, cmpAndSet, undefined);
}
exports.deleteImmutable = deleteImmutable;
function incrementImmutable(root, path, value) {
    return modifyImmutableInternal(root, path, value, incrementNumber, undefined);
}
exports.incrementImmutable = incrementImmutable;
function arrayConcatImmutable(root, path, values) {
    return modifyImmutableInternal(root, path, values, arrayConcat, undefined);
}
exports.arrayConcatImmutable = arrayConcatImmutable;
function arrayPushImmutable(root, path, ...values) {
    return modifyImmutableInternal(root, path, values, arrayConcat, undefined);
}
exports.arrayPushImmutable = arrayPushImmutable;
function arraySpliceImmutable(root, path, index, deleteCount, ...values) {
    return modifyImmutableInternal(root, path, values, arraySplice, { index, deleteCount });
}
exports.arraySpliceImmutable = arraySpliceImmutable;
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
        const copy = shallowCloneObject(root);
        for (const key in copy) {
            copy[key] = cloneImmutable(copy[key]); // cast needed to remove the Readonly<>
        }
        root = gUseFreeze ? Object.freeze(copy) : copy;
    }
    return root;
}
exports.cloneImmutable = cloneImmutable;
function cloneMutable(root) {
    const rootType = getType(root);
    if (rootType === 'array') {
        const copy = shallowCloneArray(root, root.length);
        for (let i = 0; i < copy.length; ++i) {
            copy[i] = cloneMutable(copy[i]);
        }
        root = copy;
    }
    else if (rootType === 'object') {
        const copy = shallowCloneObject(root);
        for (const key in copy) {
            copy[key] = cloneMutable(copy[key]);
        }
        root = copy;
    }
    return root;
}
exports.cloneMutable = cloneMutable;
function shallowCloneMutable(root) {
    const rootType = getType(root);
    if (rootType === 'array') {
        return shallowCloneArray(root, root.length);
    }
    else if (rootType === 'object') {
        return shallowCloneObject(root);
    }
    return root;
}
exports.shallowCloneMutable = shallowCloneMutable;
function filterImmutable(val, filter) {
    let changed = false;
    let out;
    if (Array.isArray(val)) {
        out = [];
        for (const v of val) {
            if (filter(v)) {
                out.push(v);
            }
            else {
                changed = true;
            }
        }
    }
    else {
        out = {};
        for (const key in val) {
            if (filter(val[key])) {
                out[key] = val[key];
            }
            else {
                changed = true;
            }
        }
    }
    if (!changed) {
        return val;
    }
    return gUseFreeze ? Object.freeze(out) : out;
}
exports.filterImmutable = filterImmutable;
function mapImmutable(val, callback) {
    let out;
    if (Array.isArray(val)) {
        out = new Array(val.length);
        for (let i = 0; i < val.length; ++i) {
            out[i] = callback(val[i], i);
        }
    }
    else {
        out = {};
        for (const key in val) {
            out[key] = callback(val[key], key);
        }
    }
    return replaceImmutable(val, out);
}
exports.mapImmutable = mapImmutable;
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
function diffImmutable(oNew, oOld) {
    if (oNew === oOld) {
        return undefined;
    }
    return diffImmutableRecur(oNew, oOld);
}
exports.diffImmutable = diffImmutable;
function diffImmutableRecur(o, oOld) {
    const type = getType(o);
    const typeOld = getType(oOld);
    if (type !== typeOld) {
        return o;
    }
    if (type === 'object') {
        const diff = {};
        for (const key in o) {
            const child = o[key];
            const childOld = oOld[key];
            if (!(key in oOld)) {
                diff[key] = child;
                continue;
            }
            if (child === childOld) {
                continue;
            }
            diff[key] = diffImmutableRecur(child, childOld);
        }
        for (const key in oOld) {
            if (!(key in o)) {
                diff[key] = exports.REMOVE;
            }
        }
        return gUseFreeze ? Object.freeze(diff) : diff;
    }
    else if (type === 'array') {
        const a = o;
        const aOld = oOld;
        const diff = [];
        for (let i = 0; i < a.length; ++i) {
            if (i >= aOld.length) {
                diff[i] = a[i];
            }
            else if (a[i] !== aOld[i]) {
                diff[i] = diffImmutableRecur(a[i], aOld[i]);
            }
        }
        for (let i = a.length; i < aOld.length; ++i) {
            diff[i] = exports.REMOVE;
        }
        return gUseFreeze ? Object.freeze(diff) : diff;
    }
    else {
        return o;
    }
}
