import {disconnectWallet} from "./wallet.js";

// This is only concerned with the wallet selection component / process.

import { writable } from "svelte/store";
import { Event } from "./utils.js";
import {getWallets} from "@wallet-standard/app";
import type {Wallet, WalletWithFeatures} from "@wallet-standard/base";
import {StandardEvents, type StandardEventsFeature} from "@wallet-standard/features";
import {SolanaSignAndSendTransaction} from "@solana/wallet-standard-features";
import {
    getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    getOrCreateUiWalletForStandardWallet_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
} from "@wallet-standard/ui-registry";
import type { UiWallet } from "@wallet-standard/ui";

// Technical Things
const { get:doGetWallets } = getWallets();
function walletHasSignAndSendFeature(
    wallet: Wallet,
): wallet is WalletWithFeatures<StandardEventsFeature> {
    return SolanaSignAndSendTransaction in wallet.features;
}

function subscribeToWalletEvents(
    wallet: WalletWithFeatures<StandardEventsFeature>,
): () => void {
    //TODO: this may not be needed with polling
    const dispose = wallet.features[StandardEvents].on(
        "change",
        ({ accounts }) => {
            if(wallet.name !== _selection.name){
                //NOT RELEVANT (not connected wallet)
                // console.warn("wallet change ignored for",wallet.name);
                return;
            }

            const newAccounts = accounts?.map(
                getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.bind(
                    null,
                    wallet,
                ),
            );
            if (newAccounts && newAccounts.length > 0) {

            }
            return newAccounts;
        },
    );
    return dispose;
}


type WalletMapElement = {
    wallet: WalletWithFeatures<StandardEventsFeature>,
    uiWallet: UiWallet,
}

let walletMap: {[key: string]: WalletMapElement}  = {
//  name: {
//     wallet,
//     uiWallet
//  }
}


// THis is not a store with a _realVersion because the way this new one does things it never updates
export let availableWallets: string[] = [];


let outputWallets: Wallet[];
export function recheckWallets(){

    outputWallets = doGetWallets().filter(walletHasSignAndSendFeature);
    for(let wallet of outputWallets){

        if(walletMap[wallet.name]) continue;


        subscribeToWalletEvents(wallet as WalletWithFeatures<StandardEventsFeature>);

        const uiWallet: UiWallet = getOrCreateUiWalletForStandardWallet_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(
            wallet,
        );
        walletMap[wallet.name] = {
            wallet: wallet as WalletWithFeatures<StandardEventsFeature>,
            uiWallet: uiWallet,
        }
        availableWallets.push(wallet.name);
    }
}
recheckWallets();

let selectedWalletIndex = -1;
let selectedWalletAddress: null | string;

let walletWatchInterval = setInterval(async ()=>{
    // Interval to watch for changes in selected/connected wallet

    if(!outputWallets || selectedWalletIndex === -1) return;

    if(!outputWallets[selectedWalletIndex] || !outputWallets[selectedWalletIndex].accounts || !outputWallets[selectedWalletIndex].accounts[0] ){
        // TODO: catch this for edge cases. this should count as a disconnect
        console.error("This would be a disconnect..")
        disconnectWallet();
    }

    // TODO: it is possible that accounts[0] is not always gonna be the one

    const apparentAddress = outputWallets[selectedWalletIndex].accounts[0].address;

    if(apparentAddress !== selectedWalletAddress){
        //TODO: this means they have changed their wallet, and it should trigger disconnect cycle
        if(!apparentAddress){
            // only disconnect
            console.error("This would be a disconnect..")
            disconnectWallet();
        }else{
            // disconnect then reconnect
            console.error("This would be a disconnect then reconnect..")

            // log("Apparent address:",apparentAddress);
            // log("selected address:", selectedWalletAddress)

            const selectedWalletName = outputWallets[selectedWalletIndex].name;
            await disconnectWallet();
            await selectWallet(selectedWalletName);

        }

    }

},200);


export let _selection: {
    selected: boolean,
    wallet: null | WalletMapElement,
    name: null | string
} = {
    selected: false,
    wallet: null,
    name: null,
}
export let selection = writable(_selection);


export function clearSelectedVars(){

    selectedWalletIndex = -1;
    selectedWalletAddress = null;

    _selection.selected = false;
    _selection.wallet = null;
    _selection.name = null;

    selection.set(_selection);
}


export const onSelectWallet = Event();
export async function selectWallet(name: string){
    stopExpectWallet();

    console.log("select wallet:",name)

    if(!name) return;

    _selection.wallet = walletMap[name];
    _selection.name = name;
    _selection.selected = true;
    selection.set(_selection);

    console.log("trigger select wallet")
    await onSelectWallet.trigger();

    selectedWalletIndex = Object.keys(walletMap).indexOf(name);

    selectedWalletAddress = walletMap[name].wallet.accounts[0].address;
}


export function getWalletInfo(name: string){
    //TODO: return image and whatever else
    return name;
}

let expectWalletInterval: number;
export function expectWallet(name: string ){
    stopExpectWallet();

    expectWalletInterval = setInterval(()=>{
        if( walletMap&&
             walletMap[name] &&
             walletMap[name].wallet &&
             walletMap[name].wallet.accounts &&
             walletMap[name].wallet.accounts[0]
        ){
            selectWallet(name);
        }

    }, 200);
}
export function stopExpectWallet(){
    clearInterval(expectWalletInterval);
}

export function unmountTeardown(){
    //This is really only needed for svelte dev mode. Otherwise should never be lost to an unmounted WalletSelection
    // component. 
    stopExpectWallet();
    clearInterval(walletWatchInterval);
}