<script lang="ts">
    import { createAccount, readAccount, readAccountData } from "$lib";
    import { requestAndConnectWallet } from "$lib/components/walletSelectionComponent";
    import { disconnectWallet, transacting, walletConnected, walletConnecting, walletError, walletInitial, walletState } from "kit-squared";

    

    let readAccountInput = $state(0n);
    let createAccountInput = $state('');
    function createAccountClick(){
        createAccount(createAccountInput);
    }
    

    function readAccountClick(){
        readAccount(readAccountInput);
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
        <input type="text" bind:value={readAccountInput} />
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
            <input type="text" bind:value={createAccountInput}/>
        </div>
        <div>
            <button disabled={$transacting} onclick={createAccountClick}>Create Account</button>
        </div>

    </div>

    <div class="chunk">
        <div class="bold">Update An Account</div>
        <div class="italic">To demonstrate tx functionality where account address is required.</div>
        <div>
            <input type="text">
        </div>
    </div>

    <div class="chunk">
        <div class="bold">Create Two Accounts</div>
        <div class="italic">To demonstrate multi-ix transaction.</div>
        <div>
            <input type="text">
        </div>
    </div>
{/if}
