# Program

> [Main Readme](../../README.md) > Program

The Kit² allows you to create an interface/helper for an Anchor program. 
 This program helper has methods that make it easy to

- Send transactions
- Create Instructions
- Subscribe to Events
- Get PDA addesses, and
- Read Accounts

## Create Program

```typescript
async function createProgram(programClient: {[key: string]: any;}, idl: {[key: string]: any;}, signer: null | TransactionSendingSigner = null, noEvents = false): 
```

Both the program's IDL and Codama-generated program client must be provided. A signer object (provided by wallet connection) may also be provided, but if it is absent this helper can not be used to send transactions. 

> Note: the reason the IDL is required is that Codama-generated program clients do not preserve sufficient information about program events to effectively manage them.


A further optional parameter is the `noEvents` param, which if set to `true` will prevent the program helper from subscribing to program events. You can still register callbacks but they will never fire.

_example:_
```typescript
//Create the helper
const myProgram = createProgram(yourProgramClient, yourIdl, signerFromConnectedWallet);
```


## Send Transactions
The helper has a `tx` property that will have a method for every function that the program has, to create a tx with just that function. The corresponding methods take the same params as their corresponding functions.


For example if your Anchor program has the following function:
```rust
pub fn do_something(ctx: Context<DoSomething>, some_param: u64, some_other_param: Pubkey) -> Result<()> {
    //do some stuff
}
```
The way to invoke it on your helper is:
```typescript
await myProgram.tx.doSomething(123n,"abcd...");
```
> Note: the library will infer types whenever it is possible.

The above will request a tx with a `doSomething` instruction.

### Accounts
Wherever possible, Kit² will infer any account addresses from their constraints (for example when they are PDAs based on params, etc). However, for cases where this is not possible, see the [Accounts section of the docs](./ACCOUNTS.md) for manually managing accounts.

## Create Instructions
Similar to the above, you can also create instructions to be sent later. The helper has an `ix` property that has a method corresponding to each program function. 

Any accounts [added manually](./ACCOUNTS.md) will be processed at the time this method is invoked, and not when the tx is sent, meaning you can create a single tx with multiple ixs from the same program that include different accounts.

_example:_
```typescript
const account0 = await myProgram.pda(["some seed"]);
const account1 = await myProgram.pda(["some other seed"]);

// Add account
addAccounts({someAccount: account0});

// Create ix
const ix0 = await myProgram.ix.doSomething(123n,"abcd...");

// Add different account
addAccounts({someAccount: account0});

// Create another ix
const ix0 = await myProgram.ix.doSomething(123n,"abcd...");


// Send them both in one tx
await transact([ix0,ix1]);
```


## Subscribe To Events
You may register callbacks for any program event. Events follow [the Event pattern](./../utils/EVENTS.md), and may have any number of callbacks.


The `on` parameter of the helper is used to register event callbacks:

```typescript
helper.on(eventName: string, callback = (eventData, slotNumber, signature) => {
   
})
```
Where `name` is the camelCase name of the event, and callback has 3 params:

- `eventData`: An object of event params, keys are camelCase names of each event param.
- `slotNumber`: The slot number in which this tx took place
- `signature`: The signature fo the tx from which this event was emitted.

_example:_
```typescript
// Subscribe to an event called someEvent
myProgram.on('someEvent', (eventData, slotNumber, signature) => {
    const {someParam, someOtherParam} = eventData;

    //do some stuff with someParam and someOtherParam
})
```

## PDAs

The helper provides a method for getting the address of a PDA. The seeds must be provided, see the [PDA section of the docs](./../PDAs.md) for nuances of passing specific datatypes.


```typescript
// Get the address of a PDA
const someAccountAddress = await myProgram.pda(["seeds","for","PDA"]);
```

## Reading Accounts

The helper also has a property with methods for each account type. You may either pass an addres if you already know the address, or an array of seeds if you want it to derive a PDA.

```typescript
// Read the value of an account the program owns
//    You can either pass the address if you already know it
const accountData = await myProgram.account.myAccountType(address);

//    or you can pass the seeds like in the PDA function
const accountData = await myProgram.account.myAccountType(["seeds","for","another","PDA"]);

```