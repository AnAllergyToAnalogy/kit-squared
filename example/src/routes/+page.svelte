<script lang="ts">
    import { disconnectWallet, transacting, walletConnected, walletInitial, walletState } from "../../../src/lib";

    import { createAccount, createTwoAccounts, readAccountAndUpdateStore, readAccountData, updateAccount } from "$lib";
    import { requestAndConnectWallet } from "$lib/components/walletSelectionComponent";

    
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
    .bold{
        font-weight: bold;
    }
    .chunk{
        padding: 20px;
    }
    .italic{
        font-style: italic;
        color: #666;
    }
</style>

<h1>Kit² Example Repo</h1>
<p>
    This repo shows a basic implementation of 
    <a href="https://github.com/AnAllergyToAnalogy/kit-squared">Kit²</a>
    . It interacts with a program deployed on Solana Devnet. That program has its own repo and is <a href="https://github.com/AnAllergyToAnalogy/kit-squared-example-program" target="_blank">available here</a>.
</p>


<div class="chunk">
    <div class="bold">Wallet Connection</div>
    <div>
        State: {$walletState}
    </div>
    <div>
        {#if $walletInitial}
            <button onclick={requestAndConnectWallet}>Connect Wallet</button>
        {:else if $walletConnected}
            <button onclick={disconnectWallet}>Disconnect Wallet</button>
        {:else}
            &nbsp;
        {/if}
    </div>
</div>



<div class="chunk">
    <div class="bold">Read An Account</div>
    <div class="italic">To demonstrate account reading functionality.</div>
    <div>Enter u64 account number</div>
    <div>(PDA seeds are ["someSeed", accountNumber])</div>
    <div>
        <input type="number" bind:value={readAccountInput} placeholder="Enter a u64 accountNumber"/>
    </div>
    <div>
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
</div>

{#if !$walletConnected}
    <div>
        Connect wallet to execute transactions
    </div>
{:else}
    <div class="chunk">
        <div class="bold">Create An Account</div>
        <div class="italic">To demonstrate tx functionality and events.</div>
        <div>Enter u64 account number of the account to create</div>
        <div>(PDA seeds are ["someSeed", accountNumber])</div>
        <div>
            <input type="number" bind:value={createAccountInput} placeholder="Enter a u64 accountNumber"/>
        </div>
        <div>
            <button disabled={$transacting} onclick={createAccountClick}>Create Account</button>
        </div>

    </div>

    <div class="chunk">
        <div class="bold">Update An Account</div>
        <div class="italic">To demonstrate tx functionality where account address is required.</div>
        <div>Enter u64 account number of the account to create (address is derived from this)</div>
        <div>(PDA seeds are ["someSeed", accountNumber])</div>
        <div>
            <input type="number" bind:value={updateAccountNumberInput} placeholder="Enter a u64 accountNumber"/>
        </div>

        <div class="chunk">
            <div>Function Parameters:</div>
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
        <div>
            <button disabled={$transacting} onclick={updateAccountClick}>Update Account</button>
        </div>



    </div>

    <div class="chunk">
        <div class="bold">Create Two Accounts</div>
        <div class="italic">To demonstrate multi-ix transaction.</div>

        <div>Enter two u64 account numbers of the accounts to create (addresses will be derived from these)</div>
        <div>(PDA seeds are ["someSeed", accountNumber])</div>
        <div>
            <input type="number" bind:value={createTwoAccountsInput0} placeholder="Enter a u64 accountNumber"/>
        </div>

        <div>
            <input type="number" bind:value={createTwoAccountsInput1} placeholder="Enter a u64 accountNumber"/>
        </div>
        <div>
            <button disabled={$transacting} onclick={createTwoAccountsClick}>Create Account</button>
        </div>
    </div>
{/if}
