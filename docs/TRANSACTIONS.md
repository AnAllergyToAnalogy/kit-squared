# Transactions

> [Main Readme](../README.md) > Transactions

Kit² provides functions for sending transactions, both as #methods of program helpers and generic ones for sending any instructions.

It also tracks the transaction state, and fires events when the tx state changes.


## Sending Transactions
While #program helpers provide methods for aiding in sending transactions, there is still a generic method for sending any transaction:
```typescript
async function transact(ixs: Instruction[] = [],names: string[] = [], preSimulate: boolean = true)
```
Where `ixs` is an array of `@solana/kit` `Instruction`s, and `names` is an optional array of ix names that will be fired with each tx lifecycle event. 

If `preSimulate` is `true`, the library will simulate the tx before requesting it, and cause this function fail if the tx will fail.

An alias function is provided for instances where you want to send a single ix in your tx, it provides no additional functionality and the former can still be used for this use case.
```typescript
async function transactSingle(ix: Instruction, name: string | null = null, preSimulate: boolean = true)
```


### Transaction Lifecycle
Kit² only expects one tx to be in progress at any given time. While it doesn't outright prevent multiple simultaneous txs, the tx-lifecycle management is simplified for only one.

#### transactionState

The library provides a store with the current transaction state, `$transactionState`, which can take the following values:

- `"INITIAL"` - No transaction currently in progress
- `"REQUESTED"` - Transaction has been requested by library but not submitted by user
- `"PENDING"` - Transaction has been submitted by user and is awaiting confirmation or failure.

Note, when a tx is confirmed or fails, it will revert to    `"INITIAL"` state.

#### transacting
The library also provides a derived store, `$transacting`, which is `true` if `$ransactionState` has any value other than `"INITIAL"`. 

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

These follow the #[Event pattern]


## Simulating Transactions
The library exposes a function for simulating the result of a transaction:

```typescript
async function simulate(ixs: Instruction[] = []): Promise<Simulation>
```

Where `ixs` is of the same type as the parameter for `transact()`. It uses the Kit rpc `simulateTransaction` function, and will parse any error logs in the event that it fails. 

The function returns a promise with a `Simulation` type object, which takes the following form:

```typescript
type Simulation = {
    success: boolean,  // True if the simulated tx did not fail
    error: null | SimulationError,  // Null if tx did not fail, error data if it failed
    result: any,  // Just the complete response from simulateTransaction
}
```

In the event that the simulated transction failed, the `SimulationError` type object takes the following form:

```typescript
type SimulationError = {

    instruction: string, // InstructionName
    type: string,   // anchor, program, other
    code: string,   // 0x1234
    number: number, // 6000
    label: string,  // SomeCustomError
    anchorErrorLog: string, //The full log entry with Program log: AnchorError
}
```