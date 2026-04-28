# Initialisation

> [Main Readme](../../README.md) > Initialisation

## Init

```typescript
function init(http: string, ws: string, networkType?: NetworkType): void
```

Initialises the library,  where `http` and `ws` are the respective RPC urls, and `networkType` is either `"mainnet"`,`"devnet"` or `"testnet"`.

The latter is optional and defaults to `"mainnet"`.

The `init` function will set your RPC settings, as well as initialising the wallet connection process and lifecycles. 

This function should be called before using any functionality that uses RPC calls, programs or wallet functions.
