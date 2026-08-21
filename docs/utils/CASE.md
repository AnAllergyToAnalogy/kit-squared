# Case Conversion Functions

> [Main Readme](../../README.md) > [Utils](../utils/UTILS.md) > Case Conversion Functions

Just functions to convert strings between variable naming conventions. There is a function to convert in any direction between `snake_case`, `camelCase` and `PascalCase`.

These are used internally within the library due to the nuances of Rust and IDLs.

Convert `camelCase` to `snake_case`:
```typescript
camelToSnake(name: string): string
```

Convert `snake_case` to `camelCase`:
```typescript
snakeToCamel(name: string): string
```

Convert `PascalCase` to `camelCase`:
```typescript
pascalToCamel(name: string): string
```

Convert `camelCase` to `PascalCase`:
```typescript
camelToPascal(name: string): string
```
Convert `snake_case` to `PascalCase`:
```typescript
snakeToPascal(name: string): string
```
Convert `PascalCase` to `snake_case`:
```typescript
pascalToSnake(name: string): string
```