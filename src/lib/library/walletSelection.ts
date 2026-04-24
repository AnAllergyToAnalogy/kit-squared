//TODO: there appears to be a bug when switching wallets and then switching accounts within the wallet doesnt always
// register for a reconnect. But this edge case not currently worth the time since it can always be solved with a page
//  reset.

import {disconnectWallet, initialWalletCheck} from "./wallet.js";

// //@ts-ignore
// console = {
//     warn: ()=>{},
//     log: ()=>{},
//     error: ()=>{},
// }

let log = console.log;





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
// import {connectWallet, installedUiWallets} from "$lib/someStuff";

// Technical Things
const { get:doGetWallets } = getWallets();
function walletHasSignAndSendFeature(
    wallet: Wallet,
): wallet is WalletWithFeatures<StandardEventsFeature> {
    return SolanaSignAndSendTransaction in wallet.features;
}




export const visible = writable(false);
export function showPrompt(){
    stopExpectWallet();
    _recheckWallets();

    visible.set(true);
}
export function hidePrompt(){
    visible.set(false);
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

            // console.warn("wallet change listened", outputWallets, accounts);

            const newAccounts = accounts?.map(
                getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.bind(
                    null,
                    wallet,
                ),
            );
            // console.log("new Accounts", newAccounts);
            if (newAccounts && newAccounts.length > 0) {
                // console.error("!??! 0")
                // connectedWalletAccount = newAccounts[0];
                // hasConnectedWalletAccount = true;
                // localStorage.setItem(
                //     STORAGE_KEY,
                //     `${wallet.name}:${newAccounts[0].address}`,
                // );

                // todo: storage
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

let walletMap: {[key: string]: WalletMapElement
    // {    
    //     wallet:  WalletWithFeatures<StandardEventsFeature>
    //     uiWallet: null | UiWallet,
    //     // name: string
    // }
}  = {

//  name: {
//     wallet,
//     uiWallet
//  }
}


// THis is not a store with a _realVersion because the way this new one does things it never updates
export let availableWallets: string[] = [];


// TODO === maybe these need to be Store things

// TODO #2: actual todo - have a setInterval that constantly re-runs the below or some portion of it.
//     this is needed to detect cases when a user changes the account in their walelt.
//      but, may possibly be used to simplify this whole process
// it seems that if any of the components of this are undefined, then it requires a wallet connect:
//  outputWallets[0].accounts[0].address
// thus, perhaps checking for changes in this is a better catchall
// -> may be a sligthly smarter one where if it expects a wallet to be currently connected, just check the state of that
// otherwise, check all of them

// Some wallets will stop returning a value for that, some will update it. In cases where it updates, it should change
// myKey and trigger the disconnect/connect cycle

let outputWallets: Wallet[];
function _recheckWallets(){
    // availableWallets = [];
    // walletMap = {};

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

        // installedUiWallets.push(uiWallet);
    }
}
_recheckWallets();

// TODO === end maybe

let selectedWalletIndex = -1;
let selectedWalletAddress: null | string;

let walletWatchInterval =setInterval(async ()=>{
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

// TODO: subscribe to all events on all wallets, but filter them based on whether its selected



// TODO: this may not be needed, maybe different
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

    // console.warn("clearSelectedVars..")

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

    // console.log("SELECT WALLET:",name)

    if(!name) return;




    // TODO: populate selection var
    _selection.wallet = walletMap[name];
    _selection.name = name;
    _selection.selected = true;
    selection.set(_selection);

    await onSelectWallet.trigger();


    // log(name)
    // log(Object(walletMap))
    // log(walletMap[name].wallet.accounts.length);
    // log(walletMap[name].wallet.accounts[0]);

    selectedWalletIndex = Object.keys(walletMap).indexOf(name);

    // log("check wallet")
    // log(walletMap[name].wallet);

    selectedWalletAddress = walletMap[name].wallet.accounts[0].address;
    // log(walletMap[name]);
    // log("Index:",selectedWalletIndex)

}


export function getWalletInfo(name: string){
    //TODO: return image and whatever else
    return name;
}

// let expectedWallet = null;
let expectWalletInterval: number;
export function expectWallet(name: string ){
    // log("Expect wallet:",name);
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