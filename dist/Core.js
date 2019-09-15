"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = require("./Helpers");
exports.REMOVE = Symbol('ModifyRemove');
let gUseFreeze = true;
function freezeImmutableStructures(useFreeze) {
    gUseFreeze = useFreeze;
}
exports.freezeImmutableStructures = freezeImmutableStructures;
function freezeIfEnabled(o) {
    return gUseFreeze ? Object.freeze(o) : o;
}
exports.freezeIfEnabled = freezeIfEnabled;
function cmpAndSetOrMerge(dst, src, mergeObjects, mergeArrays, deepMergeObjects, deepMergeArrays) {
    if (dst === src) {
        return dst;
    }
    const dstType = Helpers_1.getType(dst);
    const srcType = Helpers_1.getType(src);
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
            out = Helpers_1.shallowCloneArray(dst, desiredLength);
        }
        for (let i = desiredLength - 1; i >= 0; --i) {
            if (mergeArrays && !src.hasOwnProperty(i)) {
                // merge sparse arrays
                continue;
            }
            const newVal = cmpAndSetOrMerge(dst[i], src[i], deepMergeObjects, deepMergeArrays, deepMergeObjects, deepMergeArrays);
            if (newVal !== dst[i]) {
                if (out === dst) {
                    out = Helpers_1.shallowCloneArray(dst, desiredLength);
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
                    out = Helpers_1.shallowCloneObject(dst);
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
                    out = Helpers_1.shallowCloneObject(dst);
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
exports.cmpAndSet = cmpAndSet;
function cmpAndMerge(dst, src) {
    return cmpAndSetOrMerge(dst, src, true, true, false, false);
}
exports.cmpAndMerge = cmpAndMerge;
function cmpAndDeepMerge(dst, src) {
    return cmpAndSetOrMerge(dst, src, true, true, true, false);
}
exports.cmpAndDeepMerge = cmpAndDeepMerge;
function cmpAndApplyDiff(dst, src) {
    return cmpAndSetOrMerge(dst, src, true, true, true, true);
}
exports.cmpAndApplyDiff = cmpAndApplyDiff;
function incrementNumber(dst, src) {
    if (typeof dst !== 'number') {
        return src;
    }
    return dst + src;
}
exports.incrementNumber = incrementNumber;
function arrayJoin(dst, src, atFront) {
    src = cloneImmutable(src);
    if (!Array.isArray(dst)) {
        return src;
    }
    const out = atFront ? src.concat(dst) : dst.concat(src);
    return gUseFreeze ? Object.freeze(out) : out;
}
exports.arrayJoin = arrayJoin;
function arraySlice(dst, _src, params) {
    const out = Array.isArray(dst) ? dst.slice(params.start, params.end) : [];
    return gUseFreeze ? Object.freeze(out) : out;
}
exports.arraySlice = arraySlice;
function arraySplice(dst, src, params) {
    src = cloneImmutable(src);
    if (!Array.isArray(dst)) {
        return src;
    }
    const out = dst.slice(0, params.index).concat(src).concat(dst.slice(params.index + params.deleteCount));
    return gUseFreeze ? Object.freeze(out) : out;
}
exports.arraySplice = arraySplice;
function modifyImmutableInternal(root, path, value, updateFunc, updateParam) {
    const pathLength = path.length;
    const parents = new Array(pathLength);
    const parentTypes = [];
    // walk down the object path, creating intermediate objects/arrays as needed
    let leafVal = root;
    for (let i = 0; i < path.length; ++i) {
        let curType = Helpers_1.getType(leafVal);
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
                parent = Helpers_1.shallowCloneArray(parent, parent.length);
            }
            else if (parentType === 'object') {
                parent = Helpers_1.shallowCloneObject(parent);
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
exports.modifyImmutableInternal = modifyImmutableInternal;
function cloneImmutable(root) {
    const rootType = Helpers_1.getType(root);
    if (rootType === 'array') {
        const copy = Helpers_1.shallowCloneArray(root, root.length);
        for (let i = 0; i < copy.length; ++i) {
            copy[i] = cloneImmutable(copy[i]);
        }
        root = gUseFreeze ? Object.freeze(copy) : copy;
    }
    else if (rootType === 'object') {
        const copy = Helpers_1.shallowCloneObject(root);
        for (const key in copy) {
            copy[key] = cloneImmutable(copy[key]); // cast needed to remove the Readonly<>
        }
        root = gUseFreeze ? Object.freeze(copy) : copy;
    }
    return root;
}
exports.cloneImmutable = cloneImmutable;
function cloneMutable(root) {
    const rootType = Helpers_1.getType(root);
    if (rootType === 'array') {
        const copy = Helpers_1.shallowCloneArray(root, root.length);
        for (let i = 0; i < copy.length; ++i) {
            copy[i] = cloneMutable(copy[i]);
        }
        root = copy;
    }
    else if (rootType === 'object') {
        const copy = Helpers_1.shallowCloneObject(root);
        for (const key in copy) {
            copy[key] = cloneMutable(copy[key]);
        }
        root = copy;
    }
    return root;
}
exports.cloneMutable = cloneMutable;
function shallowCloneMutable(root) {
    const rootType = Helpers_1.getType(root);
    if (rootType === 'array') {
        return Helpers_1.shallowCloneArray(root, root.length);
    }
    else if (rootType === 'object') {
        return Helpers_1.shallowCloneObject(root);
    }
    return root;
}
exports.shallowCloneMutable = shallowCloneMutable;
