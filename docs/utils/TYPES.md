# Types

> [Main Readme](../../README.md) > [Utils](../utils/UTILS.md) > Types

There are a various functions for dealing with types. 

## Integer Type To Size
```typescript
function integerTypeToSize(type: string): string
```
Takes an integer type string (`u8`,`u16`,`i8`, etc.) and returns the number of bits in that type.


## Is Integer Type
```typescript
function isIntergerType(type: string | null): boolean
```
Takes a string and returns `true` if its an integer type string (`u8`,`u16`,`i8`, etc.).

## `typeEncoder`
An object that just points to `@solana/kit` type encoders for integer types and the `address` type.

_example:_
```typescript
//Encode an address
typeEncoder.address.encode("abcd....");

//Encode a u64
typeEncoder.u64.encode(12345n);
```


## `address
```typescript
function address(str: string)
```

An alias for typeEncoder.address. Makes syntax nicer when working with this fairly common type. ie, in PDA seeds:

```typescript
programHelper.pda(["a string", address("abcd...")]);
```



