<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";


    import {
        selectWallet,
        getWalletInfo,

        availableWallets,
        unmountTeardown,

    } from "kit-squared";

    import { hidePrompt, visible } from "./walletSelectionComponent";
    import { uninitialise } from "$lib";

    function selectWalletClick(name: string){
        selectWallet(name);
        hidePrompt();
    }

    function cancelClick(){
        hidePrompt();
    }

    if(browser){
        onMount(()=>{
            return ()=>{
                uninitialise();
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

        background: white;
        color:black;

        outline: solid 5px black;
        padding: 10px;

        max-width: calc(100vw - 100px);
        width: 400px;

        padding:30px;
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
                        <h2>Select a wallet to connect</h2>

                        <div class="wallets cc">
                            {#if availableWallets.length !== 0}
    
                                {#each availableWallets as walletName}

<textarea class="code">
{`onclick={selectWallet(${walletName})}`}</textarea>

                                    <div class="class">
                                        <button onclick={() => selectWalletClick(walletName)} > {getWalletInfo(walletName)} </button>
                                    </div>
                                {/each}

                            {:else}
                                    No wallets detected :(
                                
                            {/if}
                        </div>

                        <div class="centre">
                            <button onclick={cancelClick} class="cancel"  > Cancel </button>
                        </div>

                    </div>


            </div>
    </div>
{/if}