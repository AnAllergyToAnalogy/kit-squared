# General Utils

> [Main Readme](../../README.md) > [Utils](../UTILS.md) > General

General functions that dont fit in any other category.

## Sleep
```typescript
function sleep(ms: number): Promise<void>
```
Returns a promise that resolves after the defined number of milliseconds

## PDA Exists
```typescript
async function pdaExists(accountFunc: Function, address): Promise<Boolean>
```
`accountFunc` is a function that fetches an account for a given address, or fails if the account doesnt exist. `address` is the address passed to `accountFunc`. 

## Get PDA
```typescript
function getPDA(seeds: any[] = [], programId): PublicKey
```
Returns the PDA for a given programId and array of seeds.



## Lamports to SOL
```typescript
function lamportsToSol(lamports: bigint): string
```
Convert an amount in Lamports to SOL (as a string).

## SOL to Lamports
```typescript
function solToLamports(sol: any)
```
Convert an amount in SOL to lamports.


## Zeroes
```typescript
function zeroes(length: number): string
```
Pad a number with trailing zeroes for the desired length.


## Now
```typescript
function now(ms = false): bigint
```
Return current time in `s` (or `ms` if `ms = true`).


## Now
```typescript
function now(ms = false): bigint
```
Return current time in `s` (or `ms` if `ms = true`).






