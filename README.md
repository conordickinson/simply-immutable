# simply-immutable

ZERO dependencies!
FAST! See the benchmarks.
Minimal object changes on updates.
Type safety for CRUD operations in TypeScript.
Immutable in - immutable out: deep clones incoming objects/arrays for safety.

## cloneImmutable
Deep clone of an object/array.

## replaceImmutable
Replaces object/array fields in the target object/array.
Deep compare on replacing object to minimally change structure.
Creates intermediate objects/arrays as necessary.

## updateImmutable
Merges object/array fields into the target object/array.
Deep compare on updating object fields to minimally change structure.
Creates intermediate objects/arrays as necessary.

## deleteImmutable
Removes target field.

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
