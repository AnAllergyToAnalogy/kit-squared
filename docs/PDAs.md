# PDAs

> [Main Readme](../../README.md) > PDAs

Some notes on providing seeds for PDAs. When using `getPDA` or `programHelper.pda` to get a PDA, the library will infer the data type which is consequential for how it is packed and calculated.

## Strings
Any string will be assumed to be a string, and not parsed in any other way.

_example:_
```typescript
    const somePDA = await someHelper.pda(["parsed","as","strings"]);
```


## Addresses
To pass an address as a seed, use the `address` function. [See docs](./utils/TYPES.md#address).


_example:_
```typescript
    // seeds are "user", then the user's address
    const somePDA = await someHelper.pda(["user", address("abcd...")]);
```

## Integers
When adding integers as seeds for PDAs, use the following format:
```typescript
[value, size_in_bits]
```

so a `u16` with the value of `1234` would be passed as
```typescript
[1234n,"u16"]
```

_example_
```typescript
// Your PDA seeds are "user" and then the index of the user as a u32, 
//  and you want to get user 67
const somePDA = await someHelper.pda(["user",[67n,"u32"]]);
```