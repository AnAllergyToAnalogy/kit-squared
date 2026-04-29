import { writable } from "svelte/store";
import { getStoredWalletSelection } from "../library/wallet.js";
import { availableWallets, recheckWallets, selectWallet, stopExpectWallet } from "../library/walletSelection.js";

export function requestAndConnectWallet(){
    // if (has wallet already logged somehow)
    //   use that one
    // else
    //   show wallet selection thing
    //      which triggers connect when they select one

    const stored = getStoredWalletSelection();

    if(stored && availableWallets.includes(stored)){
        selectWallet(stored);
    }else{

        if(availableWallets.length === 1){
            // Only one wallet available, auto select that
            selectWallet(availableWallets[0]);
        }else{
            // Show wallet selection thing
            showPrompt();
        }
    }

}


export const visible = writable(false);
export function showPrompt(){
    stopExpectWallet();
    recheckWallets();

    visible.set(true);
}
export function hidePrompt(){
    visible.set(false);
}