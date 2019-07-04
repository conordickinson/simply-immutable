# simply-immutable

ZERO dependencies!
FAST! See the benchmarks.
Minimal object changes on updates.
Type safety for CRUD operations in TypeScript.
Immutable in - immutable out: deep clones incoming objects/arrays for safety.

## cloneImmutable
Deep clone of an object/array. Returns a deeply frozen clone.

## cloneMutable
Deep clone of an object/array. Does not freeze anything in the result, so this is a good way to remove immutability.

## shallowCloneMutable
Shallow clone of an object/array. First level of the result is not frozen.

## replaceImmutable
Replaces object/array fields in the target object/array.
Deep compare on replacing object to minimally change structure.
Creates intermediate objects/arrays as necessary.

## updateImmutable
Merges object/array fields into the target object/array.
Deep compare on updating object fields to minimally change structure.
Creates intermediate objects/arrays as necessary.

## deepUpdateImmutable
Merges object/array fields into the target object/array; merging happens recursively (unlike updateImmutable, which only merges at the first level).
Deep compare on updating object fields to minimally change structure.
Creates intermediate objects/arrays as necessary.

## deleteImmutable
Removes target field.

## diffImmutable
Given two objects/arrays, generates a diff that can be applied to the second parameter (using deepUpdateImmutable) to get the first parameter.

## filterImmutable
Filters out members of an object/array based on a filter function.

## deepFreeze
Recursively freezes an object/array and all children.

## isFrozen
Checks if an object/array is frozen.

## isDeepFrozen
Recursively checks if object/array and all children are frozen.

## freezeImmutableStructures
Enables or disables deep freezing of the outputs of the *Immutable functions.
Enabled by default, but recommended to turn off in production builds (benchmarks have deep freezing turned off).
