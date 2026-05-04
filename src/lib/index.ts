import { init as initConnection } from "./library/connection.js";
import { initialiseWallet, type NetworkType } from "./library/wallet.js";
import { startConnectSchedule } from "./library/connectSchedule.js";

export function init(http: string, ws: string, networkType?: NetworkType): void{
    initConnection(http, ws, networkType);
    initialiseWallet();
    startConnectSchedule();
}

export {getNetworkType, getNetwork, getConnection, checkAccountExists, getAccountBalance} from "./library/connection.js";
export {onConnect, onDisconnect} from "./library/connectSchedule.js";
export {
    transacting, 
    TRANSACTION_STATE,
    transactionState,
    onTransaction,

    clearAddedAccounts,
    addAccounts,
    getAddedAccounts,
    transact,

    createProgram,
} from "./library/program.js";

export * from "./library/utils.js";
export {
    walletState,
    walletInitial,
    walletConnecting,
    walletConnected,
    walletError,

    signer,
    myKey,
    me,
    myKeyString,

    isMe,
    getStoredWalletSelection,

    disconnectWallet,

    unmountWallet

} from "./library/wallet.js";
export {
    availableWallets,

    selection,

    selectWallet,
    getWalletInfo,

    unmountTeardown,

    recheckWallets,

} from "./library/walletSelection.js";

export  { 
    requestAndConnectWallet,
    visible,
    showPrompt,
    hidePrompt,

 } from "./components/walletSelectionComponent.js";

 //@ts-ignore
 export * as WalletSelection from "./WalletSelection.svelte";