"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Core_1 = require("./Core");
class ModifyContext {
    constructor(origData, isOrigMutable) {
        this.origData = origData;
        this.isOrigMutable = isOrigMutable;
        this.data = origData;
    }
    // WARNING the return value from this function is in progress and not yet entirely immutable!
    getModifiedData() {
        return this.data;
    }
    finish() {
        if (!Core_1.isFreezeEnabled) {
            return this.data;
        }
        // TODO freeze all modified structures, if enabled
        return this.data;
    }
    replace(...args) {
        const path = args.length === 1 ? [] : args.shift();
        const value = args.shift();
        this.data = Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, Core_1.cmpAndSet, undefined);
    }
    update(...args) {
        const path = args.length === 1 ? [] : args.shift();
        const value = args.shift();
        this.data = Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, Core_1.cmpAndMerge, undefined);
    }
    deepUpdate(...args) {
        const path = args.length === 1 ? [] : args.shift();
        const value = args.shift();
        this.data = Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, Core_1.cmpAndDeepMerge, undefined);
    }
    applyDiff(...args) {
        const path = args.length === 1 ? [] : args.shift();
        const value = args.shift();
        this.data = Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, Core_1.cmpAndApplyDiff, undefined);
    }
    delete(path) {
        this.data = Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, Core_1.REMOVE, Core_1.cmpAndSet, undefined);
    }
    increment(path, value) {
        return Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, Core_1.incrementNumber, undefined);
    }
    arrayConcat(path, values) {
        return Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, values, Core_1.arrayJoin, false);
    }
    arrayPush(path, ...values) {
        return Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, values, Core_1.arrayJoin, false);
    }
    arrayPop(path) {
        return Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, null, Core_1.arraySlice, { start: 0, end: -1 });
    }
    arrayShift(path) {
        return Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, null, Core_1.arraySlice, { start: 1, end: undefined });
    }
    arrayUnshift(path, ...values) {
        return Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, values, Core_1.arrayJoin, true);
    }
    arraySlice(path, start, end) {
        return Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, null, Core_1.arraySlice, { start, end });
    }
    arraySplice(path, index, deleteCount, ...values) {
        return Core_1.modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, values, Core_1.arraySplice, { index, deleteCount });
    }
}
exports.ModifyContext = ModifyContext;
