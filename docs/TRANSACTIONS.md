# Transactions

> [Main Readme](../README.md) > Transactions

Kit² provides functions for sending transactions, both as #methods of program helpers and generic ones for sending any instructions.

It also tracks the transaction state, and fires events when the tx state changes.


## Sending Transactions
While #program helpers provide methods for aiding in sending transactions, there is still a generic method for sending any transaction:
```typescript
async function transact(ixs: Instruction[] = [],names: string[] = [])
```
Where `ixs` is an array of `@solana/kit` `Instruction`s, and `names` is an optional array of ix names that will be fired with each tx lifecycle event. 

An alias function is provided for instances where you want to send a single ix in your tx, it provides no additional functionality and the former can still be used for this use case.
```typescript
async function transactSingle(ix: Instruction, name: string | null = null)
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