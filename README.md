# Kit² ( Kit Squared )

 A library that brings Solana Kit functionality to SvelteKit.

 Kit² provides wallet connection, transaction functionality (including helpers) and features such as account management as well as program helpers (interfaces) for Anchor programs. It uses `@wallet-standard` for dealing with wallets.

[Skip to Contents](#contents)

[Skip to Example Project](---)

 ## Initialising

 To initialise the library, you must initialise it with your RPC urls and specify the network type:

 ```typescript
init(http, ws, networkType)
 ```

 Where `http` and `ws` are the respective RPC urls, and `networkType` is either `"mainnet"`,`"devnet"` or `"testnet"`.

Full details available in the [Initialisation section of the docs](https://github.com/AnAllergyToAnalogy/kit-squared/blob/main/docs/framework/INITIALISATION.md)/


## Wallet Connection

The Kit² library watches for injected wallets (ie, Phantom, Metamask, etc.). 

To connect a specific wallet:

```typescript
selectWallet(name)
```

Where `name` is a string with the name of the injected wallet. The names of all available injected wallets are provided by an array `availableWallets`.

The library manages the lifecycle of the connection/disconnection process, and allows you to register callbacks for when those processes complete:

```typescript
onConnect(()=>{
    //do some stuff when the wallet connects
});
onDisconnect(()=>{
    //do some stuff when the wallet disconnects
});
```

Full details available in the [Wallet section of the docs](https://github.com/AnAllergyToAnalogy/kit-squared/blob/main/docs/framework/WALLET.md).



## Programs

To create an interface/helper for a program, both its IDL and Codama-generated program client must be provided. A signer object (provided by wallet connection) may also be provided, but if it is absent this helper can not be used to send transactions.

```typescript
createProgram(programClient, idl, signer)
```

This program helper has methods that make it easy to

- Send transactions
- Create Instructions
- Subscribe to Events
- Get PDA addesses, and
- Read Accounts

_example:_
```typesccript
//Create the helper
const myProgram = createProgram(yourProgramClient, yourIdl, signerFromConnectedWallet);

// Send a myFunction tx
await myProgram.tx.myFunction(somePara, someOtherParam);

// Build a myFunction ix for sending later
const ix = await myProgram.ix.myFunction(somePara, someOtherParam);


// Subscribe to an event called someEvent
myProgram.on('someEvent', (eventData, slotNumber, signature) => {
    const {someParam, someOtherParam} = eventData;

    //do some stuff with someParam and someOtherParam
})


// Get the address of a PDA
const someAccountAddress = await myProgram.pda(["seeds","for","PDA"]);


// Read the value of an account the program owns
//    You can either pass the address if you already know it
const accountData = await myProgram.account.myAccountType(address);

//    or you can pass the seeds like in the PDA function
const accountData = await myProgram.account.myAccountType(["seeds","for","another","PDA"]);

```

Full details available in the [Program section of the docs](https://github.com/AnAllergyToAnalogy/kit-squared/blob/main/docs/framework/PROGRAM.md).

## Transactions

Kit² provides functions for sending transactions, both as #methods of program helpers and generic ones for sending any instructions.

It also tracks the transaction state, and fires events when the tx state changes.


### Sending Transactions
Send a transaction with any instructions using
```typescript
transact(ixs, names);
```
Where `ixs` is an array of `@solana/kit` `Instruction`s, and `names` is an optional array of ix names that will be fired with each tx lifecycle event.

### Transaction Lifecycle
Kit² only expects one tx to be in progress at any given time. While it doesn't prevent multiple simultaneous txs, the tx-lifecycle management is simplified for only one.

#### transactionState

The library provides a store with the current transaction state, `$transactionState`, which can take the following values:

- `"INITIAL"` - No transaction currently in progress
- `"REQUESTED"` - Transaction has been requested by library but not submitted by user
- `"PENDING"` - Transaction has been submitted by user and is awaiting confirmation or failure.

Note, when a tx is confirmed or fails, it will revert to    `"INITIAL"` state.

#### Lifecycle Events
The library fires events every time the tx changes state. You may register callbacks for any of these, with the following format:

```typescript
callback = (names: string[])={
    //do some stuff 
}
```

The lifecycle events are:
- `onTransaction.request(callback)` - A tx was requested
- `onTransaction.submit(callback)` - A tx was submitted by user (they clicked send tx on the wallet)
- `onTransaction.confirm(callback)` - A tx was confirmed on-chain
- `onTransaction.cancel(callback)` - A tx was cancelled by the user
- `onTransaction.fail(callback)` - A tx failed


Full details available in the Transaction section of the docs

## Accounts

Kit² allows you to easily manage accounts included in a program tx. Where possible, program function and IX invocations will infer account addresses from the IDL/client. But in cases where it isn't possible, or if you want to overwrite the inferred account addresses, you can provide them with `addAccounts`.

```typescript
addAccounts({
    accountName: accountAddress,
    otherAccountName: otherAccountAddress,
})
```

These will be included with any program ix or tx until they are overwritten, or removed with 

```typescript
clearAddedAccounts()
```

Full details available in the [Accounts section of the docs](--)


## Integer types and PDAs

Kit² uses BigInts for dealing with integers, and will be accepted for all integer function params, and be used in all returned integer values. 

Howver, since PDAs pack data in a very specific way when deriving the address, when adding integers as seeds for PDAs, use the following format:
```typescript
[value, size_in_bits]
```

so a `u16` with the value of `1234` would be passed as
```typescript
[1234n,16n]
```

_example_
```typescript
// Your PDA seeds are "user" and then the index of the user as a u32, 
//  and you want to get user 67
const address = await myProgram.pda(["user",[67n, 32n]]);
```

Full details available in the [Integers section of the docs]


# Contents

### [Initialisation](https://github.com/AnAllergyToAnalogy/kit-squared/blob/main/docs/framework/INITIALISATION.md)
Full details on initialising.

### [Wallet]



### [Utils](--)

##