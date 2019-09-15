import {
  arrayJoin,
  arraySlice,
  arraySplice,
  cmpAndApplyDiff,
  cmpAndDeepMerge,
  cmpAndMerge,
  cmpAndSet,
  incrementNumber,
  isFreezeEnabled,
  modifyImmutableInternal,
  REMOVE,
} from './Core';

export class ModifyContext<T> {
  private data: T;

  constructor(private readonly origData: T, private readonly isOrigMutable: boolean) {
    this.data = origData;
  }

  // WARNING the return value from this function is in progress and not yet entirely immutable!
  public getModifiedData(): Readonly<T> {
    return this.data;
  }

  public finish(): Readonly<T> {
    if (!isFreezeEnabled) {
      return this.data;
    }

    // TODO freeze all modified structures, if enabled
    return this.data;
  }

  public replace<V extends T>(value: V): void;
  public replace(path: Array<string|number>, value: any): void;
  public replace(...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    this.data = modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, cmpAndSet, undefined);
  }

  public update<V extends T>(value: V): void;
  public update(path: Array<string|number>, value: any): void;
  public update(...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    this.data = modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, cmpAndMerge, undefined);
  }

  public deepUpdate<V extends T>(value: V): void;
  public deepUpdate(path: Array<string|number>, value: any): void;
  public deepUpdate(...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    this.data = modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, cmpAndDeepMerge, undefined);
  }

  public applyDiff<V extends T>(value: V): void;
  public applyDiff(path: Array<string|number>, value: any): void;
  public applyDiff(...args) {
    const path = args.length === 1 ? [] : args.shift();
    const value = args.shift();
    this.data = modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, cmpAndApplyDiff, undefined);
  }

  public delete(path: Array<string|number>): void {
    this.data = modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, REMOVE, cmpAndSet, undefined);
  }

  public increment(path: Array<string|number>, value: number): Readonly<T> {
    return modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, value, incrementNumber, undefined);
  }

  public arrayConcat(path: Array<string|number>, values: any[]): Readonly<T> {
    return modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, values, arrayJoin, false);
  }

  public arrayPush(path: Array<string|number>, ...values: any[]): Readonly<T> {
    return modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, values, arrayJoin, false);
  }

  public arrayPop(path: Array<string|number>): Readonly<T> {
    return modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, null, arraySlice, { start: 0, end: -1 });
  }

  public arrayShift(path: Array<string|number>): Readonly<T> {
    return modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, null, arraySlice, { start: 1, end: undefined });
  }

  public arrayUnshift(path: Array<string|number>, ...values: any[]): Readonly<T> {
    return modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, values, arrayJoin, true);
  }

  public arraySlice(path: Array<string|number>, start: number, end?: number): Readonly<T> {
    return modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, null, arraySlice, { start, end });
  }

  public arraySplice(path: Array<string|number>, index: number, deleteCount: number, ...values: any): Readonly<T> {
    return modifyImmutableInternal(this.isOrigMutable ? undefined : this.origData, this.data, path, values, arraySplice, { index, deleteCount });
  }
}
