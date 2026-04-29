# Storage

> [Main Readme](../../README.md) > [Utils](../utils/UTILS.md) > Storage

There are a couple of helper functions that wrap around localStorage to make the syntax a little friendlier. 

## `readStorage`
```typescript
function readStorage(key: string,defaultVal: any = null)
```

Read a value from storage and return its value, or return the `defaultVal` if there is no localStorage item that matches the key.

## `writeStorage`
```typescript
function writeStorage(key: string,value: any)
```

Write a value to local storage.

## `clearStorage`
```typescript
function clearStorage(key: string)
```
Remove local storage for the given key.

