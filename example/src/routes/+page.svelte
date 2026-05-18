<script lang="ts">
    import { disconnectWallet, transacting, transactionState, walletConnected, walletInitial, walletState } from "kit-squared";

    import { createAccount, createTwoAccounts, readAccountAndUpdateStore, readAccountData, updateAccount } from "$lib";
    import { requestAndConnectWallet } from "$lib/components/walletSelectionComponent";

    import LOGO from "$lib/assets/kit-squared-logo-transparent.png";
    
// Read Account
    let readAccountInput = $state(0);
    function readAccountClick(){
        readAccountAndUpdateStore(readAccountInput);
    }
    
// Create Account
    let createAccountInput = $state('');
    function createAccountClick(){
        createAccount(createAccountInput);
    }

// Update Account
    let updateAccountNumberInput = $state('');
    let updateAccountU32Input = $state('');
    let updateAccountU64Input = $state('');
    let updateAccountBoolInput = $state('1');
    function updateAccountClick(){
        const someBool = updateAccountBoolInput === '1';
        updateAccount(updateAccountNumberInput,updateAccountU32Input,updateAccountU64Input,someBool);
    }
    
// Create Two Accounts
    let createTwoAccountsInput0 = $state('');
    let createTwoAccountsInput1 = $state('');
    function createTwoAccountsClick(){
        
         createTwoAccounts(createTwoAccountsInput0,createTwoAccountsInput1);
    }

</script>

<style>

</style>

<div class="main">
<div class="inner">


<img src="{LOGO}" alt="Kit Squared Logo" class="logo">
<h1>Kit² Example Repo</h1>

<p>
    This repo shows a basic implementation of 
    <a href="https://github.com/AnAllergyToAnalogy/kit-squared">Kit²</a>. It interacts with a program deployed on Solana Devnet. That program has its own repo and is <a href="https://github.com/AnAllergyToAnalogy/kit-squared-example-program" target="_blank">available here</a>.
</p>

<p class="italic">
    Note that this example implementation uses the free solana.com RPCs which may be subject to rate limits and other constraints.
</p>


<h2>Setup</h2>

<h3>Install</h3>
<div class="italic">Install the library</div>
<textarea class="code">
npm install kit-squared</textarea>

<h3>Initialise</h3>
<div class="italic">Init library, and create program helper for example anchor program</div>
<textarea class="code">
init(rpc_http,rpc_ws,"devnet");

program = await createProgram(programClient,idl, signer);</textarea>


<h2>Wallet</h2>

<!-- <div > -->
    <h3>Wallet Connection</h3>
    <textarea class="code">
{"Wallet State: {$walletState}"}</textarea>


    <div>
        Wallet State: {$walletState}
    </div>

    <br/>
        {#if $walletInitial}
        <div class="centre">

            <button onclick={requestAndConnectWallet}>Connect Wallet</button>
            </div>

        {:else if $walletConnected}

<textarea class="code">
{"onclick={disconnectWallet}"}</textarea>


<div class="centre">
            <button onclick={disconnectWallet}>Disconnect Wallet</button>
</div>
        {:else}
            &nbsp;
        {/if}
    <!-- </div> -->
<!-- </div> -->

<h3>Wallet Connection Events</h3>
<div class="italic">
    Register an event callback for when wallet connects or disconnects
</div>
<textarea class="code">
{`onConnect(async ()=>{
    console.log("wallet connected")
)`}</textarea>


<h2>Accounts</h2>

    <h3>Read An Account</h3>


    <div class="italic">To demonstrate account reading functionality.</div>

<textarea class="code">
const accountAddress = await program.pda(   
    [
        "someSeed",
        [accountNumber, "u64"]
    ]
);
await program.account.someAccount(accountAddress);

//Or pass the seeds directly

await program.account.someAccount([
    "someSeed",
    [accountNumber, "u64"]
]);</textarea>


    <div class="instruction">Enter u64 account number</div>
    <div class="instruction">(PDA seeds are ["someSeed", accountNumber])</div>
    <div>
        <input type="number" bind:value={readAccountInput} placeholder="Enter a u64 accountNumber"/>
    </div>
    <div class="centre">
            <button onclick={readAccountClick}> Read Account </button>
    </div>

    <div class="chunk">
        <div class="bold">Data:</div>

        {#if !$readAccountData}
            <div>
                Account data not loaded
            </div>
        {:else}

            <div>
                someKey: {$readAccountData.someKey}
            </div>
            <div>
                someU64: {$readAccountData.someU64}
            </div>
            <div>
                someU32: {$readAccountData.someU32}
            </div>
            <div>
                someBool: {$readAccountData.someBool}
            </div>
        {/if}



    </div>

{#if !$walletConnected}
    <div class="instruction centre">
        Connect wallet to execute transactions.
    </div>
{:else}

<h2>Transactions</h2>

<h3>Transaction State</h3>
<div class="italic">The current transaction state.</div>
<textarea class="code">
{"Transaction State: {$transactionState}"}</textarea>
<div>
    Transaction State: {$transactionState}
</div>



<h3>Execute createAccount tx</h3>
<div class="italic">To demonstrate tx functionality and events.</div>

<textarea class="code">
await program.tx.createAccount(accountNumber);</textarea>

<div class="instruction">Enter u64 account number of the account to create</div>
<div class="instruction">(PDA seeds are ["someSeed", accountNumber])</div>
<div>
    <input type="number" bind:value={createAccountInput} placeholder="Enter a u64 accountNumber"/>
</div>
<div class="centre">
    <button disabled={$transacting} onclick={createAccountClick}>Execute Transaction</button>
</div>

<h3>Program Event</h3>
<div class="italic">Register event callback for when a program event fires.</div>
<textarea class="code">
{`program.on("someEvent", (eventData: any,slotNumber: bigint,signature: string)=>{`} 
    {`const {someKey, someU64} = eventData;`}
    {`if(isMe(someKey)){ `} 
        {`alert(\`You created an account. someU64: \${someU64}\`);`} 
    {`}`}
{`});`}</textarea>

    


        <h3>Execute updateAccount tx</h3>
        <div class="italic">To demonstrate tx functionality where account address is required.</div>

<textarea class="code">
{`const accountAddress = await program.pda(
    [
        "someSeed",
        [BigInt(accountNumber), "u64"]
    ]
);

// Add the account to update since it can't be inferred by params
addAccounts({
    toUpdate: accountAddress
});

// Do the tx
await program.tx.updateAccount(someU32, someU64, someBool);`}</textarea>


        <div class="instruction">Enter u64 account number of the account to create (address is derived from this)</div>
        <div class="instruction">(PDA seeds are ["someSeed", accountNumber])</div>
        <div>
            <input type="number" bind:value={updateAccountNumberInput} placeholder="Enter a u64 accountNumber"/>
        </div>

        <div class="chunk">
            <div class="instruction">Function Parameters:</div>
            <div>
                someU32: <input type="number" bind:value={updateAccountU32Input} placeholder="Enter a u32">
            </div>
            <div>
                someU64: <input type="number" bind:value={updateAccountU64Input} placeholder="Enter a u64">
            </div>
            <div>
                someBool (must be "true" or TX will fail): 
            <select bind:value={updateAccountBoolInput}>
                <option value="1">true</option>
                <option value="0">false</option>
            </select>
            </div>
        </div>
        <div class="centre">
            <button disabled={$transacting} onclick={updateAccountClick}>Execute Transaction</button>
        </div>



<h3>Transaction Lifecycle Event</h3>
<div class="italic">Register event callback for when TX fails.</div>
<textarea class="code">
{"onTransaction.fail((labels)=>{"}
    {'alert(`Transaction faied: ${labels.join(", ")}`);'}
{"})" }</textarea>



    <h3>Execute two createAccount ixs</h3>
    <div class="italic">To demonstrate multi-ix transaction.</div>

<textarea class="code">
// Build the IXs
const ix0 =  await program.ix.createAccount(accountNumber0);
const ix1 =  await program.ix.createAccount(accountNumber1);

// Send TX
await transact([ix0,ix1])</textarea>

    <div class="instruction">Enter two u64 account numbers of the accounts to create (addresses will be derived from these)</div>
    <div class="instruction">(PDA seeds are ["someSeed", accountNumber])</div>
    <div>
        <input type="number" bind:value={createTwoAccountsInput0} placeholder="Enter a u64 accountNumber"/>
    </div>

    <div>
        <input type="number" bind:value={createTwoAccountsInput1} placeholder="Enter a u64 accountNumber"/>
    </div>
    <div class="centre">
        <button disabled={$transacting} onclick={createTwoAccountsClick}>Execute Transaction</button>
    </div>
{/if}

</div>
</div> 