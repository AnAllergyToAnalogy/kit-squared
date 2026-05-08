# Wallet

> [Main Readme](../../README.md) > Wallet

The Kit² library watches for injected wallets (ie, Phantom, Metamask, etc.). 

## Wallet Selection

To connect a specific wallet:
```typescript
async function selectWallet(name: string)
```

Where `name` is a string with the name of the injected wallet. The names of all available injected wallets are provided by an array `availableWallets`.

The list of available wallets will be processed when the library is initialised, but due to the unpredictable and asynchronous way in which various wallets are injected, it is recommended to refresh this list immediately before displaying them for selection by the user.

This can be done with `recheckWallets`:
```typescript
function recheckWallets()
```

The library will remember if a user was previously connected (it stores the selection in localStorage), and try to reconnect. 

To disconnect the wallet and remove local storage, use `disconnectWallet`.

```typescript
async function disconnectWallet()
```


## Wallet State

The wallet connectivity state is provided by the store `$walletState`, which can take the following values:

- `"INITIAL"`: Wallet is not connected
- `"CONNECTING"`: Wallet is in the process of connecting
- `"CONNECTED"`: Wallet is connected
- `"ERROR"`: An error has occured while trying to connect the wallet.

This store will update automatically throughout the wallet connection lifecylce. 

There are also derivied stores for each state, ie `$walletInitial`, `$walletConnecting`, `$walletConnected` and `$walletError`, which are booleans that are true if `$walletState` matches their respective states.


## Connect / Disconnect events

The library also fires events when it has finished connecting or disconnecting wallets. These use the [Event pattern](TODO utils events), and callbacks can be registered as follows:

```typescript
onConnect(()=>{
    //do some stuff when the wallet connects
});
onDisconnect(()=>{
    //do some stuff when the wallet disconnects
});
```

_Note: A special case exists for onConnect, where if the wallet is already detected as "connected" when you register an onConnect callback, that callback will immediately fire. This can be disabled by adding a second parameter, with `false`, ie:_
>
```typescript
onConnect(()=>{
    //do some stuff when the wallet connects, but don't do it immediately if its already connected
}, false);
```

## Wallet Vars

Various variables related to wallet state are exposed.

### `signer`

The `TransactionSendingSigner` provided by the connected wallet. It will update when you connect or change wallets. This should be provided to your program helpers. `null` if no wallet connected.

### `myKey` 

A `string` with the public key of the connected wallet. `null` if no wallet connected.

### `$me`

A store with the value of `myKey`. Both update at the same time. 


## Extra Wallet Functions

### `isMe(address)`
```typescript
function isMe(address: any): boolean
```

Returns `true` if the address passed matches the above variable `myKey`. 

### `getWalletInfo(name)`
```typescript
function getWalletInfo(name: string)
```

Currently only a placeholder function that returns the name of the wallet. It will provide additional info for better displaying wallet options.

## Teardown
There is an internal loop which watches for specific changes that are not universally emitted by different wallets. Therefore, a `teardown` function is provided to be used when unmounting wallet functionality. 

```typescript
function unmountTeardown()
```

## Example Wallet Selection Component

An Example `WalletSelection` Component is provided, with associated functions in `walletSelectionComponent.ts`. 

It should ideally be placed in Layout, or a similarly permanent location, and will handle the wallet selection process.

The component can be summonned with the `requestAndConnectWallet()`.