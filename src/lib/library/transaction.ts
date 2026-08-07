import { writable } from "svelte/store";
import { Event } from "./utils.ts";
import {signer} from "./wallet.js";

import { appendTransactionMessageInstructions, assertIsTransactionMessageWithSingleSendingSigner, createTransactionMessage, getBase64EncodedWireTransaction, partiallySignTransactionMessageWithSigners, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, type Address, type Base64EncodedDataResponse, type Instruction, type Lamports, type Signature, type Slot, type TokenBalance, type TransactionError, type TransactionSendingSigner } from "@solana/kit";
import { getConnection } from "./connection.ts";



export let _transacting = false;
export let transacting = writable(_transacting);

function _setTransacting(state: string){
    _transacting = state !== TRANSACTION_STATE.INITIAL;
    transacting.set(_transacting);
}
export const TRANSACTION_STATE = {
    INITIAL:    "INITIAL",
    REQUESTED:  "REQUESTED",
    PENDING:    "PENDING",
}
const INITIAL = TRANSACTION_STATE.INITIAL;
const REQUESTED = TRANSACTION_STATE.REQUESTED;
const PENDING = TRANSACTION_STATE.PENDING;

export const transactionState = writable(TRANSACTION_STATE.INITIAL);

const onRequest   = Event();
const onSubmit    = Event();
const onConfirm   = Event();
const onCancel    = Event();
const onFail      = Event();

export const onTransaction = {
    request: onRequest,
    submit:  onSubmit,
    confirm: onConfirm,
    cancel:  onCancel,
    fail:    onFail,
}


function _txWasCancelled(e: Error){
    let msg;
    if(e.message){
        msg = e.message.toLowerCase();
    }else{
        msg = e.toString().toLowerCase();
    }
    return msg.includes('denied') || msg.includes('rejected') || msg.includes('cancelled');
}


export type Simulation = {
    result: any,
    success: boolean,
    error: null | SimulationError,
}
export type SimulationError = {

    instruction: string, // InstructionName
    type: string,   // anchor, program, etc
    code: string,   // 0x1234
    number: number, // 6000
    label: string,  // SomeCustomError
    anchorErrorLog: string, //Program log: AnchorError
}


function _parseError(result: any): SimulationError{

    const instructionPrefix = "Program log: Instruction: ";
    const errorPrefix = "Program log: AnchorError ";
    const programErrorPrefix = errorPrefix+"thrown";

    const errorCodeFlag = "failed: custom program error: ";

    function _isPrefix(log: string, prefix: string){
        return (log.substring(0, prefix.length) === prefix);
    }

    function _between(str: string, prefix: string, suffix: string){

        if(!str.includes(prefix) || !str.includes(suffix)) return "";

        let from = str.indexOf(prefix) + prefix.length;
        let to;
        if(suffix.length === 0){
            to = str.length;
        }else{
            to = str.indexOf(suffix); 
        }

        return str.substring(from,to);
    }

    let errorType: "anchor" | "program" | "other" = "anchor";
    let instruction: string = "";
    let errorNumber: number = 0;
    let errorMessage: string = "";
    let errorLabel: string = "";
    let anchorErrorLog: string = "";
    let errorCode: string = "";

    const logs: string[] = result.value.logs;
    for(let log of logs){
        if(_isPrefix(log, instructionPrefix)){
            instruction = log.substring(instructionPrefix.length);
        }else if(_isPrefix(log, errorPrefix)){
            anchorErrorLog = log;

            if(_isPrefix(log, programErrorPrefix)){
                errorType = "program";
            }else{
                errorType = "anchor";
                //TODO: catch other
            }
            errorNumber = Number(_between(log,"Error Number: ",". Error Message:"));
            errorMessage = _between(log," Error Message: ","");
            errorLabel = _between(log,"Error Code: ",". Error Number:");
            
        }else if(log.includes(errorCodeFlag)){
            errorCode = _between(log,errorCodeFlag,"");
        }
    }

    return {
        instruction,
        type: errorType,
        code: errorCode,
        number: errorNumber,
        label: errorLabel,
        anchorErrorLog: anchorErrorLog,
    }

}

export async function simulate(ixs: Instruction[] = []): Promise<Simulation>{
    const connection = getConnection();
    const rpc = connection.rpc;

    let simulateTxConfig = {
        commitment: "finalized",
        encoding: "base64",
        replaceRecentBlockhash: true,
        sigVerify: false,
        minContextSlot: undefined,
        innerInstructions: true,
        accounts: undefined
    };


    const feePayer = signer as TransactionSendingSigner;
        
    // Set up an abort controller.
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send({ abortSignal });

    const transactionMessage = pipe(
                createTransactionMessage({ version: 0 }),
                (message) => setTransactionMessageFeePayerSigner(feePayer, message),
                (message) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
                (message) => appendTransactionMessageInstructions(ixs, message)
    );

    assertIsTransactionMessageWithSingleSendingSigner(transactionMessage);
    
    const partiallySigned = await partiallySignTransactionMessageWithSigners(transactionMessage);

    const base64EncodedWireTransaction = getBase64EncodedWireTransaction(partiallySigned);


    let simulateResult = await rpc
        //@ts-ignore
        .simulateTransaction(base64EncodedWireTransaction, simulateTxConfig)
        .send();

    const success = !Boolean(simulateResult?.value?.err);


    const error = success ? null : _parseError(simulateResult);

    return {
        result: simulateResult,
        success,
        error
    };

}

export async function transact(ixs: Instruction[] = [],names: string[] = [], preSimulate: boolean = true){
    _setTransacting(REQUESTED);
    onRequest.trigger(names);


    if(preSimulate){
        const simResult = await simulate(ixs);
        if(!simResult.success){
            console.error(simResult.error);
            onFail.trigger(names);
            _setTransacting(INITIAL);
            return;
        }
    }

    const connection = getConnection();
    try{
        const signature = await connection.sendTransactionFromInstructionsWithWalletApp({
            feePayer: signer as TransactionSendingSigner,
            instructions: ixs
        });

        _setTransacting(PENDING);
        onSubmit.trigger(names);


        // Set up an abort controller.
        const abortController = new AbortController();

        const confirmed = await connection.getRecentSignatureConfirmation({
            abortSignal: abortController.signal,
            commitment: 'confirmed',
            signature: signature as Signature
        });

        _setTransacting(INITIAL);
        onConfirm.trigger(names);

    }catch(e: any){
        console.error(e);

        if(_txWasCancelled(e as Error)){
            // TODO: properly catch this and other errors
            onCancel.trigger(names);
        }else{
            onFail.trigger(names);
        }
        _setTransacting(INITIAL);
    }

}

export async function transactSingle(ix: Instruction, name: string | null = null, preSimulate: boolean = true){
    let names = name ? [name] : [];
    return await transact([ix], names, preSimulate);
}