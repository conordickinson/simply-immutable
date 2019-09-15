"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.getType = getType;
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
exports.shallowCloneObject = shallowCloneObject;
function shallowCloneArray(a, len) {
    const out = new Array(len);
    for (let i = 0; i < len; ++i) {
        out[i] = a[i];
    }
    return out;
}
exports.shallowCloneArray = shallowCloneArray;
