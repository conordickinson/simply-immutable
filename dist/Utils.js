"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FunctionParse_1 = require("./FunctionParse");
const Helpers_1 = require("./Helpers");
const Core_1 = require("./Core");
const ModifyContext_1 = require("./ModifyContext");
var Core_2 = require("./Core");
exports.cloneImmutable = Core_2.cloneImmutable;
exports.cloneMutable = Core_2.cloneMutable;
exports.freezeImmutableStructures = Core_2.freezeImmutableStructures;
exports.REMOVE = Core_2.REMOVE;
exports.shallowCloneMutable = Core_2.shallowCloneMutable;
var Helpers_2 = require("./Helpers");
exports.isDeepFrozen = Helpers_2.isDeepFrozen;
exports.isFrozen = Helpers_2.isFrozen;
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
    return Core_1.modifyImmutableInternal(root, root, normalizePath(path, args), value, Core_1.cmpAndSet, undefined);
}
exports.replaceImmutable = replaceImmutable;
function updateImmutable(root, ...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    return Core_1.modifyImmutableInternal(root, root, normalizePath(path, args), value, Core_1.cmpAndMerge, undefined);
}
exports.updateImmutable = updateImmutable;
function deepUpdateImmutable(root, ...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    return Core_1.modifyImmutableInternal(root, root, normalizePath(path, args), value, Core_1.cmpAndDeepMerge, undefined);
}
exports.deepUpdateImmutable = deepUpdateImmutable;
function applyDiffImmutable(root, ...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    return Core_1.modifyImmutableInternal(root, root, normalizePath(path, args), value, Core_1.cmpAndApplyDiff, undefined);
}
exports.applyDiffImmutable = applyDiffImmutable;
function deleteImmutable(root, path, ...paramValues) {
    return Core_1.modifyImmutableInternal(root, root, normalizePath(path, paramValues), Core_1.REMOVE, Core_1.cmpAndSet, undefined);
}
exports.deleteImmutable = deleteImmutable;
function incrementImmutable(root, path, value) {
    return Core_1.modifyImmutableInternal(root, root, path, value, Core_1.incrementNumber, undefined);
}
exports.incrementImmutable = incrementImmutable;
function arrayConcatImmutable(root, path, values) {
    return Core_1.modifyImmutableInternal(root, root, path, values, Core_1.arrayJoin, false);
}
exports.arrayConcatImmutable = arrayConcatImmutable;
function arrayPushImmutable(root, path, ...values) {
    return Core_1.modifyImmutableInternal(root, root, path, values, Core_1.arrayJoin, false);
}
exports.arrayPushImmutable = arrayPushImmutable;
function arrayPopImmutable(root, path) {
    return Core_1.modifyImmutableInternal(root, root, path, null, Core_1.arraySlice, { start: 0, end: -1 });
}
exports.arrayPopImmutable = arrayPopImmutable;
function arrayShiftImmutable(root, path) {
    return Core_1.modifyImmutableInternal(root, root, path, null, Core_1.arraySlice, { start: 1, end: undefined });
}
exports.arrayShiftImmutable = arrayShiftImmutable;
function arrayUnshiftImmutable(root, path, ...values) {
    return Core_1.modifyImmutableInternal(root, root, path, values, Core_1.arrayJoin, true);
}
exports.arrayUnshiftImmutable = arrayUnshiftImmutable;
function arraySliceImmutable(root, path, start, end) {
    return Core_1.modifyImmutableInternal(root, root, path, null, Core_1.arraySlice, { start, end });
}
exports.arraySliceImmutable = arraySliceImmutable;
function arraySpliceImmutable(root, path, index, deleteCount, ...values) {
    return Core_1.modifyImmutableInternal(root, root, path, values, Core_1.arraySplice, { index, deleteCount });
}
exports.arraySpliceImmutable = arraySpliceImmutable;
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
    return Core_1.freezeIfEnabled(out);
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
    const type = Helpers_1.getType(o);
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
    const type = Helpers_1.getType(o);
    const typeOld = Helpers_1.getType(oOld);
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
                diff[key] = Core_1.REMOVE;
            }
        }
        return Core_1.freezeIfEnabled(diff);
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
            diff[i] = Core_1.REMOVE;
        }
        return Core_1.freezeIfEnabled(diff);
    }
    else {
        return o;
    }
}
function modifyMultiImmutable(root, isMutable = false) {
    return new ModifyContext_1.ModifyContext(root, isMutable);
}
exports.modifyMultiImmutable = modifyMultiImmutable;
