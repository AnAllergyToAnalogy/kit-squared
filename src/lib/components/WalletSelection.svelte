<script>
    import { env } from '$env/dynamic/public';
    import { browser } from "$app/environment"
    import { onMount } from "svelte";

    // This import is neede to keep the first ever load from calculating wallet state values in time
    import {walletState} from "$lib/web3/wallet.ts";
    walletState;

    import {
        selectWallet,
        getWalletInfo,
        visible,
        showPrompt,
        hidePrompt,
        availableWallets,
        unmountTeardown
    } from "$lib/web3/walletSelection.js";
    import {initialise} from "$lib/web3/wallet.js";

    // TODO: import initialise from wallet
    //      -> this registers an onSelectWallet which is the thing that registers the wallet listeners and connects

    function selectWalletClick(name){
        selectWallet(name);
        hidePrompt();
    }

    function cancelClick(){
        hidePrompt();
    }

    if(browser){
        onMount(()=>{
            initialise(env.PUBLIC_USE_MAINNET);

            // this used to have startWalletFindCycle but pretty sure that isn't needed anymore
            return ()=>{
                unmountTeardown();
            }
        })

    }

</script>



<style>
    #walletSelectionArea{
        position: fixed;
        top:0;
        left:0;

        width:100%;
        height:100%;

        display: flex;
        justify-content: center;
        align-items: center;

        background: rgba(0,0,0,0.8);
        z-index: 999;
    }
    .walletSelection {
        /* width: 100%;
        height: 75%; */

        background: black;
        color:white;

        outline: solid 5px white;
        padding: 10px;

        max-width: calc(100cw - 25px);
    }

    h2{
        text-align: center;
    }

    .wallets{
        margin: 20px 0;
        row-gap: 5px;
    }

</style>

{#if $visible}
    <div id="walletSelectionArea">
            <div class="walletSelection">

                    <div class="cc">
                        <h3>Select a wallet to connect</h3>

                        <div class="wallets cc">
                            {#if availableWallets.length !== 0}
    
                                {#each availableWallets as walletName}
                                    <!-- <div class="class"> -->
                                        <button onclick={() => selectWalletClick(walletName)} > {getWalletInfo(walletName)} </button>
                                    <!-- </div> -->
                                {/each}

                            {:else}
                                    No wallets detected :(
                                
                            {/if}
                        </div>

                        <button onclick={cancelClick} type={"cancel"} > Cancel </button>
                    </div>


            </div>
    </div>
{/if}