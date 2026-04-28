# Accounts

> [Main Readme](../../README.md) > Accounts

The Kit² allows you to easily manage accounts included in a program tx. Where possible, program function and IX invocations will infer account addresses from the program client / IDL that you provided to the helper. But in cases where it isn't possible, or if you want to overwrite the inferred account addresses, you can provide them with 
`addAccounts`.

## Add Accounts

```typescript
function addAccounts(accts: { [key: string]: Address } = {})
```
_example:_
```typescript
addAccounts({
    accountName: accountAddress,
    otherAccountName: otherAccountAddress,
})
```

Adds named accounts to all program txs and ixs. These accounts will be included with any program ix or tx until they are overwritten, or removed with `clearAddedAccounts()`. 

Accounts are ingested at the time that the tx or ix helper function is called.

## Clear Added Accounts
```typescript
function clearAddedAccounts()
```
Clears all added accounts.

_example:_

If you want to send a single tx with two of the same type of IX using different accounts:

```typescript
addAccounts({
    someAccount: address1,
    someOtherAccount: address2
})
const ix1 = await myProgram.ix.someFunction();

addAccounts({
    someAccount: address3,
})
const ix2 = await myProgram.ix.someFunction();

//The tx will be sent with two someFunction instructions, but the address for "someAccount" will be different for each of them, but they will both have the same address for "someOtherAccount".
await transact([ix1,ix2]);
```

**Note: if a named account has been added that a function doesn't require, then the account will still be included with the ix, but it will not cause it to fail.**

## Get Added Accounts
```typescript
function getAddedAccounts(): { [key: string]: Address }
```
Just returns the object of all currently added accounts.