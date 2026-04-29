import {
    type Address,
    createSolanaRpcFromTransport,
    type Instruction,
    type TransactionSendingSigner,
    createSolanaRpcSubscriptions,
    createSolanaRpc,

    pipe,
    createTransactionMessage,
    appendTransactionMessageInstructions,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,

    assertIsTransactionMessageWithSingleSendingSigner,
    signAndSendTransactionMessageWithSigners, getBase58Decoder,
    type ReadonlyUint8Array,

} from '@solana/kit';


import { createRecentSignatureConfirmationPromiseFactory } from '@solana/transaction-confirmation';
import type { NetworkType } from './wallet.js';

declare const sendTransactionFromInstructionsWithWalletAppFactory: (rpc: ReturnType<typeof createSolanaRpcFromTransport>) => ({ feePayer, instructions, abortSignal, }: {
    feePayer: TransactionSendingSigner;
    instructions: Array<Instruction>;
    abortSignal?: AbortSignal | null;
}) => Promise<string>;


let rpcUrl: string | null  = null;
let wsUrl: string | null = null;
let network: NetworkType | null = null;

export function getNetworkType(): NetworkType | null{
    return network;
}

export function init(
    http: string,
    ws: string,
    networkType: NetworkType = "mainnet",
){
    rpcUrl  = http; 
    wsUrl   = ws; 
    network = networkType;      
}

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


// !!! TODO
export async function checkAccountExists(address: Address): Promise<boolean>{
    // return true; 
    //todo: this
   return await getAccountBalance(address) > 0n;
}
export async function getAccountBalance(address: Address): Promise<bigint>{
    return await(await getConnection().getLamportBalance(address)).value;
}
