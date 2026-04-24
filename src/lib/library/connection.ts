import { env } from '$env/dynamic/public';

let log = console.log;

import {
    type KeyPairSigner,
    type Address,
    createSolanaRpcFromTransport,
    sendAndConfirmTransactionFactory,
    type Instruction,
    type Commitment,
    type TransactionSendingSigner,
    type Lamports,
    createSolanaRpcSubscriptions,
    type Account,
    type Decoder,
    type MessageModifyingSigner,
    createSolanaRpc,

    pipe,
    createTransactionMessage,
    appendTransactionMessageInstructions,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,

    signTransactionMessageWithSigners,
    assertIsSendableTransaction,
    getSignatureFromTransaction,
    assertIsTransactionMessageWithSingleSendingSigner,
    signAndSendTransactionMessageWithSigners, getBase58Decoder,
    type ReadonlyUint8Array,

} from '@solana/kit';


// export { type RpcTransport } from '@solana/kit';
import { createRecentSignatureConfirmationPromiseFactory } from '@solana/transaction-confirmation';

declare const sendTransactionFromInstructionsWithWalletAppFactory: (rpc: ReturnType<typeof createSolanaRpcFromTransport>) => ({ feePayer, instructions, abortSignal, }: {
    feePayer: TransactionSendingSigner;
    instructions: Array<Instruction>;
    abortSignal?: AbortSignal | null;
}) => Promise<string>;



// const RPC_URLS = {
//     localhost:  "http://127.0.0.1:8899",
//     devnet:     "https://api.devnet.solana.com",
//     testnet:    "https://api.testnet.solana.com",
//     mainnet:    "https://api.mainnet-beta.solana.com",
//     env:        env.PUBLIC_URL_RPC
// }
// const WS_URLS = {
//     localhost:  "http://127.0.0.1:8899",
//     devnet:     "wss://api.devnet.solana.com",
//     testnet:    "wss://api.testnet.solana.com",
//     mainnet:    "wss://api.mainnet-beta.solana.com",
//     env:        env.PUBLIC_URL_WS
// }


//TODO: have made this just network name, maybe need to return to having the url
// let network: string | null = null;

let rpcUrl: string | null  = null;
let wsUrl: string | null = null;
let network: string | null = null;

export function configureNetwork(
    http: string,
    ws: string,
    networkType: string = "mainnet",
){
    rpcUrl  = http; 
    wsUrl   = ws; 
    network = networkType;      
}

// export function setNetwork(networkName: string){
//     network = networkName;
//     // const selectedNetwork = RPC_URLS[networkName];
//     // if(selectedNetwork){
//     //     network = selectedNetwork;
//     // }else{
//     //     throw new Error(`Unknown network: ${networkName}`);
//     // }
// }


export function getNetwork(){
    return {
        http: rpcUrl,
        ws: wsUrl,
        networkType: network,
    }
}

function _checkNetwork(){
    if(!network) throw new Error("Network not configured. Must use configureNetwork to set rpc URLS and network type.")
}

// const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
//
// const { value: balance } = await rpc.getBalance(myWallet).send();
// const { value: accountInfo } = await rpc.getAccountInfo(myAccount).send();
// const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

function _connect(){
    _checkNetwork();

    const rpc = createSolanaRpc(rpcUrl as string);
    const rpcSubscriptions =  createSolanaRpcSubscriptions(wsUrl as string);

    const getLamportBalance = async function(_address: any){
        return rpc.getBalance(_address);
    }


    const signatureBytesToBase58String = (signatureBytes:  ReadonlyUint8Array | Uint8Array) => {
        return getBase58Decoder().decode(signatureBytes);
    };
    const sendTransactionFromInstructionsWithWalletAppFactory = (rpc: ReturnType<typeof createSolanaRpcFromTransport>) => {
        const sendTransactionFromInstructionsWithWalletApp = async ({
                                                                        feePayer,
                                                                        instructions,
                                                                        abortSignal
                                                                    }: {
                                                                        feePayer: TransactionSendingSigner;
                                                                        instructions: Array<Instruction>;
                                                                        abortSignal?: AbortSignal | null;
                                                                    }): Promise<string> => {
            const { value: latestBlockhash } = await rpc.getLatestBlockhash().send({ abortSignal });
            const transactionMessage = pipe(
                createTransactionMessage({ version: 0 }),
                (message) => setTransactionMessageFeePayerSigner(feePayer, message),
                (message) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
                (message) => appendTransactionMessageInstructions(instructions, message)
            );
            assertIsTransactionMessageWithSingleSendingSigner(transactionMessage);
            const signatureBytes = await signAndSendTransactionMessageWithSigners(transactionMessage);
            const signature = signatureBytesToBase58String(signatureBytes);
            return signature;
        };
        return sendTransactionFromInstructionsWithWalletApp;
    };
    const sendTransactionFromInstructionsWithWalletApp = sendTransactionFromInstructionsWithWalletAppFactory(rpc);

    const getRecentSignatureConfirmation = createRecentSignatureConfirmationPromiseFactory({ rpc, rpcSubscriptions });

    return {
        rpc,
        rpcSubscriptions,
        getLamportBalance,

        sendTransactionFromInstructionsWithWalletApp,
        getRecentSignatureConfirmation,
    }
}

export function getConnection() {
    if (!network) throw new Error("Network not configured (you must call setNetwork before this point).");
    return _connect()
}


export async function checkAccountExists(address: Address): Promise<boolean>{
    return true; 
    //todo: this
//    return await(await getAccountBalance(address)).value > 0n;
}
export async function getAccountBalance(address: Address){
    return await getConnection().getLamportBalance(address);
}
