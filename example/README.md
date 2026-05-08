# Kit² Example Repo

Example usage of Kit². This shows wallet connectivity, reading accounts and sending various txs. It interacts with a program deployed on Solana Devnet. That program has its own repo and is [available here](https://github.com/AnAllergyToAnalogy/kit-squared-example-program).

## Install

```
npm i
```

##  Run Dev

```
npm run dev
```


## Files of Note

### `+page.svelte`
Most of the visual/interactive elements are on the main [`+page.svelte`](./src/routes/+page.svelte).

### `index.ts`
The guts of the program interactions, initialising the library etc are all done in [`index.ts`](./src/lib/index.ts).

### `WalletSelection.svelte`
There is a [WalletSelection](./src/lib//components/WalletSelection.svelte) component that provides a basic popup for selecting a wallet to connect.

The logic for showing/hiding the component, and triggering the relevant library functionality, are handled by [`walletSelectionComponent.ts`](./src/lib/components/walletSelectionComponent.ts).

The WalletSelection component is implmenented in [`+layout.svelte`](./src/routes/+layout.svelte).

### `app.html`

Note the additional line in [`app.html`](./src/app.html), 

```
    <script type="module"> var global = global || window ; global.process = {env:{}}</script>
```

It is needed because the Codama-generated anchor program clients make direct reference to `process.env["NODE_ENV"]` which is not how environment ariables are accessed within svelte.

The above is a hacky way of reventing this from breaking program client imports, but will be patched and improved in a later version of this library.