# Connection

> [Main Readme](../../README.md) > Connection

There are a few functions for getting current config, as well as querying blockchain data.

## `getNetworkType`

```typescript
function getNetworkType(): NetworkType | null
```
Returns the configured network type (`devnet`,`testnet` or `mainnet`), or `null` if it hasn't been initialised.


## `getNetworkType`

```typescript
function getNetwork(): {
    http: string | null;
    ws: string | null;
    networkType: NetworkType | null;
}
```
Returns the configuration you used to initialise the framework. All properties are `null` if it hasn't been initialised.


## `getConnection`

```typescript
function getConnection(): : {
    rpc: Rpc<SolanaRpcApiForTestClusters>;
    rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
    getLamportBalance: (_address: any) => Promise<...>;
    sendTransactionFromInstructionsWithWalletApp: ({ feePayer, instructions, abortSignal }: {
        feePayer: TransactionSendingSigner;
        instructions: Array<Instruction>;
        abortSignal?: AbortSignal | null;
    }) => Promise<string>;
    getRecentSignatureConfirmation: GetRecentSignatureConfirmationPromiseFn;
}
```
Returns an object with rpc connections as well as functions relating to transactions. These are primarily used within other parts of the framework but have been exposed for those working closer to the metal.


## `checkAccountExists`

```typescript
async function checkAccountExists(address: Address): Promise<boolean>
```

Returns `true` if the account has a balance greater than 0. 


## `getAccountBalance`

```typescript
async function getAccountBalance(address: Address): Promise<bigint>
```

Returns the accounts balance in Lamports.

