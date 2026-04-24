
let log = console.log;

import { writable, derived } from "svelte/store";
import {Event} from "./utils.js";
import {getNetwork} from "./connection.js";
import {
    selection,
    _selection,
    onSelectWallet,
    selectWallet,
    availableWallets,
    showPrompt,
    expectWallet, clearSelectedVars
} from "./walletSelection.js";
import {clearStorage, readStorage, writeStorage} from "./storage.js";
import {
    getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
} from "@wallet-standard/ui-registry";
import {getWalletAccountFeature, getWalletFeature, type UiWallet, type UiWalletAccount} from "@wallet-standard/ui";
import {
    StandardConnect,
    type StandardConnectFeature,
    StandardDisconnect,
    type StandardDisconnectFeature
} from "@wallet-standard/features";
import {SolanaSignAndSendTransaction, type SolanaSignAndSendTransactionFeature} from "@solana/wallet-standard-features";
import {address} from "@solana/kit";
import {getTransactionEncoder, type Transaction} from "@solana/transactions";
import type {TransactionSendingSignerConfig} from "@solana/signers";
import type {IdentifierString} from "@wallet-standard/base";
import {getAbortablePromise} from "@solana/promises";
import type {SignatureBytes} from "@solana/keys";

export const WALLET_STATE = {
    INITIAL:    "INITIAL",
    CONNECTING: "CONNECTING",
    CONNECTED:  "CONNECTED",
    ERROR:      "ERROR",
}
const INITIAL = WALLET_STATE.INITIAL;
const CONNECTING = WALLET_STATE.CONNECTING;
const CONNECTED = WALLET_STATE.CONNECTED;
const ERROR = WALLET_STATE.ERROR;



export let walletState = writable(WALLET_STATE.INITIAL);
function _setWalletState(state: string){
    walletState.set(state);
}
// Helper vars
export const walletInitial = derived(walletState, ($state) => {
    return $state === WALLET_STATE.INITIAL;
})
// export const walletInitial = writable(true);
export const walletConnecting = derived(walletState, ($state) => {
    return $state === WALLET_STATE.CONNECTING;
})
// export const walletConnecting = writable(false);
export const walletConnected = derived(walletState, ($state) => {
    return $state === WALLET_STATE.CONNECTED;
});
// export const walletConnected = writable(false);
export const walletError = derived(walletState, ($state) => {
    return $state === WALLET_STATE.ERROR;
})
// export const walletError = writable(false);




export let signer : null | TransactionSendingSigner;
export let myKey: string | null = null;
export let me = writable(myKey as string | null);
export let myKeyString: string | null = null;

type NetworkType = "mainnet" | "devnet" | "testnet";
let networkType: NetworkType;


export function isMe(address: any){
    if(!address || !myKey) return false;
    return myKey.toString() === address.toString();
}


// Wallet Storage
function storeWalletSelection(name: string){
    writeStorage("walletSelection",name);
}
export function getStoredWalletSelection(): string | null{
    return readStorage("walletSelection", null);
}
function clearStoredWalletSelection(){
    clearStorage("walletSelection");
}
export const storedWalletSelectionFound = getStoredWalletSelection();


//@ts-ignore
export let connectedWalletAccount: UiWalletAccount | null = null;
//@ts-ignore
export let hasConnectedWalletAccount = writable(false);
//@ts-ignore
export let connectedWallet: UiWallet | null = null;
//@ts-ignore
export let hasConnectedWallet = writable(false);


// let existingWalletUnsubscribe = null;
// function _killExistingWallet(){
//     if(existingWalletUnsubscribe){
//         existingWalletUnsubscribe();
//         existingWalletUnsubscribe = null;
//     }
//
//     //TOOD: any other teardown
// }


function uiWalletAccountsAreSame(
    a: UiWalletAccount,
    b: UiWalletAccount,
): boolean {
    if (a.address !== b.address) {
        return false;
    }
    const underlyingWalletA =
        getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(a);
    const underlyingWalletB =
        getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(b);
    return underlyingWalletA === underlyingWalletB;
}

async function connectWallet(uiWallet: UiWallet){
    // console.log("connect ui wallet", uiWallet);

    _setWalletState(CONNECTING);

    // Get some sorta thing
    const wallet =
        getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(uiWallet);


    // Accounts that are available?
    const existingAccounts = [...uiWallet.accounts];


    // Do some stuff to get the ability to connect
    const connectFeature = getWalletFeature(
        uiWallet,
        StandardConnect,
    ) as StandardConnectFeature[typeof StandardConnect];


    // Wallet accounts for all the wallets in this connected one maybe
    const accountsPromise = connectFeature
        .connect()
        .then(({ accounts }) => {
            // console.log("connected", accounts);
            // return accounts;
            return accounts.map(
                getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.bind(
                    null,
                    wallet,
                ),
            ) as readonly UiWalletAccount[];
        });


    // I don't know whhy this is called nextAccounts. Some other layer of wallet type.
    const nextAccounts = await accountsPromise;
    // console.log("next accounts", nextAccounts);


    // Just set connectedWallet
    connectedWallet = uiWallet;
    hasConnectedWallet.set(true);


    //TODO: not sure what this is doing

    // Try to choose the first never-before-seen account. Gonna assume this is the right move for now
    for (const nextAccount of nextAccounts) {
        if (
            !existingAccounts.some((existingAccount) =>
                uiWalletAccountsAreSame(nextAccount, existingAccount),
            )
        ) {
            // onAccountSelect(nextAccount);
            // console.error("Found not seen account, set as connectedWalletAccount");
            connectedWalletAccount = nextAccount;
            hasConnectedWalletAccount.set(true);
            _setWalletState(CONNECTED);

            // localStorage.setItem(
            //     STORAGE_KEY,
            //     `${wallet.name}:${connectedWalletAccount.address}`,
            // );
            // console.log("compare accounts", connectedWalletAccount);
            return;
        }
    }
    if (nextAccounts.length > 0) {
        // onAccountSelect(nextAccounts[0]);
        // console.error("Fallback to just using the first one available")
        connectedWalletAccount = nextAccounts[0];
        hasConnectedWalletAccount.set(true);
        _setWalletState(CONNECTED);

        // localStorage.setItem(
        //     STORAGE_KEY,
        //     `${wallet.name}:${connectedWalletAccount.address}`,
        // );
        // console.log("default accounts", connectedWalletAccount);
        return
    }

    console.error("No available wallets found for unspecified reason")
    _setWalletState(INITIAL);
}

export async function disconnectWallet(){
    log("disconnect wallet..")
    clearStoredWalletSelection();
    clearSelectedVars();

    if (!connectedWallet) {
        // log("connected wallet var empty. just clear vars.")
        // log("one or both expected account objects are missing")
    }else{
        const disconnectFeature = getWalletFeature(
            connectedWallet,
            StandardDisconnect,
        ) as StandardDisconnectFeature[typeof StandardDisconnect];
        await disconnectFeature.disconnect();
    }

    connectedWallet= null;
    hasConnectedWallet.set(false);

    connectedWalletAccount = null;
    hasConnectedWalletAccount.set(false);

    signer = null;
    myKey = null;
    me.set(null);

    _setWalletState(INITIAL);

    onDisconnect.trigger();


}

import type { TransactionSendingSigner } from "@solana/signers";

function _buildTransactionSendingSigner(_networkType: NetworkType ): TransactionSendingSigner{

    if(!connectedWalletAccount) throw new Error("connectedWalletAccount is null")
    

    const signAndSendTransactionFeature = getWalletAccountFeature(
        connectedWalletAccount as UiWalletAccount,
        SolanaSignAndSendTransaction,
    ) as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];


    const transactionSendingSigner = {
        address: address(connectedWalletAccount.address),
        async signAndSendTransactions(
            transactions: Transaction[],
            config: TransactionSendingSignerConfig = {},
        ) {
            const { abortSignal, ...options } = config;
            abortSignal?.throwIfAborted();
            const transactionEncoder = getTransactionEncoder();
            if (transactions.length > 1) {
                //TODO: pretty sure this is just for this specific case
                throw new Error("should only have one transaction");
            }
            if (transactions.length === 0) {
                return [];
            }
            if (!connectedWalletAccount) {
                throw new Error("no connected wallet account");
            }
            const [transaction] = transactions;
            const wireTransactionBytes =
                transactionEncoder.encode(transaction);
            const walletAccount =
                getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(
                    connectedWalletAccount,
                );

            let chain: IdentifierString = `solana:${networkType}` as IdentifierString;

            // if(mainnet){
            //     chain = 'solana:mainnet' as IdentifierString;
            // }else{
            //     chain = 'solana:devnet' as IdentifierString;
            // }


            const inputWithOptions = {
                ...options,
                transaction: wireTransactionBytes as Uint8Array,
                // chain: `solana:${getNetwork()}` as IdentifierString,
                chain,
                account: walletAccount,
            };
            const [{ signature }] = await getAbortablePromise(
                signAndSendTransactionFeature.signAndSendTransaction(
                    inputWithOptions,
                ),
                abortSignal,
            );
            // console.log("sign signature", signature);
            return Object.freeze([signature as SignatureBytes]);
        },
    };

    return transactionSendingSigner;
}

export function initialise(_networkType: NetworkType) {

    networkType = _networkType;

    // selection = {
    //      selected: false,
    //      wallet: {
    //          wallet,
    //          uiWallet
    //      },
    //      name: null,
    // }



    onSelectWallet(async ()=>{

        if(!_selection || !_selection.wallet) throw new Error("Wallet selection is null");

        // log("-> on Select wallet")
            // They just specified which wallet they are gonna use it didn't connect. Connect i done else where



        //Unlisten previous wallet if there is one
        // if(signer){
        //     //Todo: rework this for new signer thing
        //     signer.removeAllListeners();
        //
        //     _killExistingWallet();
        // }

        // console.warn("Before connect wallet")
        // Connect wallet
        await connectWallet(_selection.wallet.uiWallet);

        // console.warn("after connect wallet");

        // Update signer object
        // signer = _selection.wallet;

        
        signer = _buildTransactionSendingSigner(networkType);
        myKey = signer.address;
        myKeyString = signer.address;

        me.set(myKey.toString())

        // Update local storage
        storeWalletSelection(_selection.name as string);

        onConnect.trigger();

        // console.warn("TODO: more wallet stuff")

        // TODO: Create the wallet thing that can be subscribed to
        //
        //
        // // Subscribe to connect and disconnect events
        // wallet.on("connect", ()=>{
        //     myKey = wallet.publicKey;
        //     me.set(myKey.toString());
        //     onConnect.trigger();
        // });
        // wallet.on("disconnect", ()=>{
        //     myKey = null;
        //     me.set(null);
        //     onDisconnect.trigger();
        // });
        //
        // // Trigger actual connection
        // connect();
        // // This has callbacks which will catch the changes

        // log("-->  done on select wallet")

    });

    initialWalletCheck();

}


export function requestAndConnectWallet(){
    log("request and connect wallet..")

    // if (has wallet already logged somehow)
    //   use that one
    // else
    //   show wallet selection thing
    //      which triggers connect when they select one

    const stored = getStoredWalletSelection();

    if(stored && availableWallets.includes(stored)){
        // console.warn("select stored wallet..")
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

export function initialWalletCheck(){

    // console.warn("Initial wallet check.")

    //Called by walletSelection.ts after it first sees what wallets it has
    if(getStoredWalletSelection()){
        // console.warn("Has stored..")
        // requestAndConnectWallet();
        expectWallet(getStoredWalletSelection() as string);
    }
}


export const onConnect = Event();
export const onDisconnect = Event();