//TODO:
// - tx triggers
// multi tx stuff

import { browser, building, dev, version } from '$app/environment';
import { writable } from "svelte/store";
import { Buffer } from 'buffer';
import {camelToSnake, snakeToCamel, camelToPascal, snakeToPascal, getPDA, pascalToCamel, sleep, type EventType, type Callback} from "./utils.js";
import {Event} from "./utils.js";
import {signer} from "./wallet.js";
import {getConnection} from "./connection.js";
import {typeEncoder} from "./utils.js";
import {fetchEncodedAccount, getAddressFromPublicKey, getBase64Codec, type Address, type Codec, type Instruction, type LogsNotificationsApi, type ReadonlyUint8Array, type Slot, type TransactionError} from "@solana/kit";

// type ProgramNotifications = <AsyncIterable<Readonly<{
//     context: Readonly<{
//         slot: Slot;
//     }>;
//     value: Readonly<{
//         err: TransactionError | null;
//         logs: readonly string[];
//         signature: Signature;
//     }>;

import type { TransactionSendingSigner } from "@solana/signers";

type ProgramNotifications = AsyncIterable<Readonly<{
    context: Readonly<{
        slot: Slot;
    }>;
    value: Readonly<{
        err: TransactionError | null;
        logs: readonly string[];
        signature: Signature;
    }>;
}>>
type ProgramNotification =  Readonly<{
    context: Readonly<{
        slot: Slot;
    }>;
    value: Readonly<{
        err: TransactionError | null;
        logs: readonly string[];
        signature: Signature;
    }>;
}>


import {type Signature} from "@solana/kit";

let log = console.log;

// if(browser){
//     window.Buffer = Buffer;
// }

// function readAccount(type, name){}

export let _transacting = false;
export let transacting = writable(_transacting);

function _setTransacting(state: string){
    // console.warn("set transacting:",state);
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


let addedAccounts: {[key: string]: Address;} = {};
export function clearAddedAccounts(){
    addedAccounts = {};
}
export function addAccounts(accounts: {[key: string]: Address;}){
    for(let a in accounts){
        addedAccounts[a] = accounts[a];
    }
}
export function getAddedAccounts(){
    return addedAccounts;
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


// function transact(ixObjects = []){
//     const feePayer = signer;
//     const instructions = [];
//
// }

export async function transactMultiple(ixs: Instruction[] = [],names: string[] = []){
    _setTransacting(REQUESTED);
    onRequest.trigger(names);

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



    }catch(e){

        if(_txWasCancelled(e as Error)){
            // TODO: properly catch this and other errors
            log("-> Rejected?");
            onCancel.trigger(names);
        }else{
            log("-> Failed?");
            onFail.trigger(names);
        }

        _setTransacting(INITIAL);

        // TODO:
        // log("")
        // log("=== TEMPORARY ERROR LOGGING ===")
        // log("tx error catch:")
        // log(e);
        // log("message:",e.message);
        // log("code:",e.code);
        // log("data:",e.data);
        // log(Object.keys(e))
        // log("=== END ERROR LOGGING ===");
        // log("");
    }

}
export async function transact(ix: Instruction, name: string){
    return await transactMultiple([ix], [name]);
}

export async function createProgram(programClient: {[key: string]: any;}, idl: {[key: string]: any;}, signer: null | TransactionSendingSigner = null, noEvents = true){
    //programName should be in snakeCase

    if(!programClient){
        throw new Error("Missing program client.")
    }
    if(!idl){
        throw new Error("Missing program IDL.")
    }

    const program_name = idl.metadata.name;
    const PROGRAM_NAME = program_name.toUpperCase();
    const programName = snakeToCamel(program_name);

    const programId = programClient[PROGRAM_NAME+"_PROGRAM_ADDRESS"];
    const programId_fromIDL = idl.address;

    if(programId !== programId_fromIDL){
        throw new Error("IDL and program client do not have matching address.");
    }

    async function pda(seeds: any[]){
        return getPDA(seeds, programId);
    }


    const onEventDropout = Event();
    const on = function(eventName: string, callback: Callback){
        //callback = (eventData, slotNumber, signature)
        // _eventTranslation[eventName] = onEvent
        _eventTranslation[eventName](callback);
    }
    const _eventTranslation: {[key: string]: EventType;} = {};

    // Events
    const _events: {[key: string]: {
        name: string,
        discriminator: [],
        codec: Codec<Function>
    }} = {};
    for(let event of idl.events){
        const nameCamel = pascalToCamel(event.name);
        _events[event.name] = {
            name: nameCamel,
            discriminator: event.discriminator,
            codec: programClient[`get${event.name}Codec`](),
        }

        _eventTranslation[nameCamel] = Event();
    }
    // Set up an abort controller.
    const abortController = new AbortController();




    async function _beginConsumingMessage(programNotifications: ProgramNotifications){
        // Keep this part separate so that it can be done separately and doesn't lock up the rest of the init

        log("Begin consuming messages...")
        log(programNotifications)

        try{
            // Consume messages.
            for await (const notification of programNotifications){
                log("New notification:")
                log(notification)
                // slot: notification.context.slot : bigInt
                // signature: notification.value.signature : string (big sig)
                _parseNotification(notification);
            }
        }catch(e){
            // The subscription went down.
            // Retry it and also trigger event informing connection died
            // _subscribeToProgram();
            log("Failed for some reason:")
            log(e);
            onEventDropout.trigger(programName);
            setTimeout(_subscribeToProgram, 1000);
            // _subscribeToProgram();
        }

        log("hmm..")
    }
    async function _subscribeToProgram(){
        // log(".  get connection..")
        const connection = getConnection();

        const rpcSubscriptions = connection.rpcSubscriptions;

        


        const logsNotifications  = rpcSubscriptions.logsNotifications({
            mentions: [programId]
        });

        let programNotifications: ProgramNotifications;

        
        try{
            programNotifications= await logsNotifications.subscribe({ abortSignal: abortController.signal });
        }catch(e){
            log("FAIL BOAT")
            console.error(e);
            throw new Error("failed to subscribe to program")
            return;
        }

        _beginConsumingMessage(programNotifications);

    }
    const DISCRIMINATOR_LENGTH = 8;
    function _findMatchingEvent(data: ReadonlyUint8Array<ArrayBuffer>){
        for(let e in _events) {
            const event = _events[e];
            if(data.subarray(0,DISCRIMINATOR_LENGTH).join(",") === event.discriminator.join(",")){
                return event;
            }
        }
        return null;
    }
    function _parseNotification(notification: ProgramNotification){

        // log("Notification received:")
        // log(notification)

        // slot: notification.context.slot : bigInt
        // signature: notification.value.signature : string (big sig)

        const slot = notification.context.slot;
        const signature = notification.value.signature;

        const UNCONFIRMED = "1111111111111111111111111111111111111111111111111111111111111111";
        if(signature === UNCONFIRMED) return; //Don't parse those weird pre-transactions


        const STEM = "Program data: ";
        const logs = notification.value.logs;
        const datas = logs.filter((a: string) => a.includes(STEM));
        const rawEvents = datas.map((a: string) => a.substring(STEM.length));

        for(let d of rawEvents){
            const data: ReadonlyUint8Array<ArrayBuffer> = getBase64Codec().encode(d);
            // const codec = _findMatchingEventCodec(data);
            //  = _findMatchingEvent(data);
            const matchingEvent = _findMatchingEvent(data);

            // log("===")
            // log("> ",name);

            if(matchingEvent){
                const {codec, name} = matchingEvent;
                const usable_data = data.subarray(DISCRIMINATOR_LENGTH);
                const decoded: any = codec.decode(usable_data);

                // log("decoded:")
                // log(decoded);


                // TODO: better integer parsing than just assuming numbers should be integers
                for(let v in decoded){
                    if(typeof decoded[v] === "number"){
                        decoded[v] = BigInt(decoded[v]);
                    }
                }


                _eventTranslation[name].trigger(decoded, slot, signature)
            }else{
                log("Event Not Found:",name);
            }
        }
    }
    function _killProgramSubscription(){
        // console.log("Kill program subscription!")
        abortController.abort();
    }

    if(!noEvents){
        await _subscribeToProgram();
    }

    function killProgram(){
        _killProgramSubscription();
        killEvents();
    }
    function killEvents(){

        //@ts-ignore
        for(let e in _eventTranslation){
            _eventTranslation[e].killAll();
        }
    }

    const ixs: {[key: string]: Function;} = {};
    // const txs = {};

    const tx: {[key: string]: Function;} = {};
    // const mtx = {};

    async function readAccount(accountName: string,address: Address){

        const account = await fetchEncodedAccount(getConnection().rpc, address);
        if(account.exists){
            const AccountName = camelToPascal(accountName);
            const codec = programClient[`get${AccountName}Codec`]();
            const values = codec.decode(account.data);
            for(let v in values){
                if(typeof values[v] === "number"){
                    values[v] = BigInt(values[v]);
                }
            }
            return values;
        }else{
            return null;
        }

        // getConnection().getAccountsFactory()
    }


    function getAccountPropertyType(accountName: string, propertyName: string){
        const AccountName = camelToPascal(accountName);
        const property_name = camelToSnake(propertyName);
        for(let t of  idl.types){
            if(t.name === AccountName){
                for(let f of t.type.fields){
                    if(f.name === property_name){
                        return f.type;
                    }
                }
            }
        }
        return null;
    }

    type IdlInstruction = {
        name: string,
        discriminator: number[],
        accounts: any[],
        args: any[]
    }
    type IxProps = {[key: string]: any;};

    async function addIxAccounts(instruction: IdlInstruction,ixProps: IxProps ){

        function getArgType(name_snake: string){
            for(let arg of instruction.args){
                if(arg.name === name_snake){
                    return arg.type;
                }
            }
        }

        //instruction is the property from the IDL
        // Adds accounts to ixProps

        // PDAs are listed and calculated last
        let PDAs: any[] = [];

        // Iterate through accounts and add them as possible. Save PDAs for last in case they are derived from other
        //  accounts.
        const accounts = instruction.accounts;
        for(let account of accounts){
            const name = account.name;
            const nameCamel = snakeToCamel(name);

            if(ixProps[nameCamel]) continue; // skip if it's already been added

            if(account.signer){ 
                if(!signer) throw new Error("Signer not found");

                ixProps[nameCamel] = signer.address;
            }else if(account.address){
                ixProps[nameCamel] = account.address;
            }else if(account.pda){
                // Do all the PDAs at the end when all the other accounts are done, in case they are derived from other
                //  accounts or variables.
                PDAs.push(account);
            }else{
                // log("was missed...")
            }
        }

        // Now do the PDAs
        while(PDAs.length > 0){
            const unadded = [];

            for(let account of PDAs){

                // console.warn("add account:",account.name)


                const seeds = [];
                let failed = false;
                for(let seed of account.pda.seeds){
                    switch(seed.kind){
                        case "const":
                            seeds.push(Uint8Array.from(seed.value));
                            break;

                        case "arg":
                            let argType = getArgType(seed.path);
                            const argValue = ixProps[snakeToCamel(seed.path)]; // assume this has already been encoded

                            if(argType === "string"){
                                seeds.push(argValue);
                                break;
                            }

                            if(argType === "pubkey"){
                                argType = "address";
                            }

                            if(!typeEncoder[argType]){
                                throw new Error(`no encoder for arg type:`+argType);
                            }

                            seeds.push(typeEncoder[argType].encode(argValue));
                            break;

                        case "account":
                            if(seed.account){
                                // It is the value of property of another account that must be read

                                //path: accountName.variableName
                                const [parentName,property] = seed.path.split(".");
                                //account: AccountType
                                if(ixProps[parentName]){
                                    //TODO: read account of type seed.account, with address ixProps[parentName] and
                                    // use [property] of that.
                                    // Will need to infer type from the account
                                    const accountData = await readAccount(seed.account, ixProps[parentName]);
                                    if(!accountData) throw new Error(`Unable to read account relating to ${seed.account}: ${ixProps[parentName]}`);
                                    const value = accountData[property];

                                    const propertyType = getAccountPropertyType(seed.account,property);
                                    if(!propertyType) throw new Error(`Unable to read property type relating to ${seed.account}: ${property}`);

                                    seeds.push(typeEncoder[propertyType].encode(value));

                                }else{
                                    // its not ready yet
                                    failed = true;
                                    break;
                                }

                            }else{
                                // It is just the address of the account
                                const value = ixProps[seed.path];
                                if(!value){
                                    // Hasn't been added yet, so can't do this PDA yet
                                    failed = true;
                                    break;
                                }else{
                                    seeds.push(typeEncoder.address.encode(value));
                                }
                            }
                            break;
                            //TODO
                            //@ts-ignore
                            // return encoder.address()
                    }
                    if(failed){
                        unadded.push(account);
                        break;
                    }

                }
                // const seeds = account.pda.seeds.map(seed =>{
                //
                //     }
                // )


                // log("seeds:")
                // log(seeds)

                ixProps[snakeToCamel(account.name)] = await pda(seeds);

                // log("PDA:",ixProps[snakeToCamel(account.name)])

            }

            if(unadded.length === PDAs.length){
                // None added this iteration. This is a failing state.
                if(unadded.length === 1){
                    throw new Error("Unable to calculate PDA: "+unadded[0].name);
                }else{
                    throw new Error(`Unable to calculate ${unadded.length} PDAs.`);
                }
            }else{
                PDAs = unadded;
            }
        }
    }

    for(let instruction of idl.instructions){
        const name = instruction.name;
        const nameCamel = snakeToCamel(name);
        const NamePascal = snakeToPascal(name);

        const argTypes = instruction.args;

        ixs[nameCamel] = async function(){
            if(arguments.length !== argTypes.length){
                throw new Error(`Incorrect arguments provided for ${name}. Received ${arguments.length}, expected ${argTypes.length}.`);
            }

            let ixProps: {[key: string]: any;} = {};
            for(let account in addedAccounts){
                ixProps[account] = addedAccounts[account];
            }

            for(let i = 0; i < arguments.length; i++){
                ixProps[snakeToCamel(argTypes[i].name)] = arguments[i];
            }

            await addIxAccounts(instruction,ixProps);
            return programClient[`get${NamePascal}Instruction`](ixProps);
        }


        tx[nameCamel] = async function(){
            let ix = await ixs[nameCamel](...arguments)
            await transact(ix,nameCamel);
        }

        // get rid of mtx for now. they can build their ix and then use transactMultiple
        // mtx[nameCamel] = async function(){
        //     let ix = ixs[nameCamel](...arguments)
        //     // return _mtxReturn(ix,nameCamel);
        //     // returns
        //     //  - all tx mtxs pre-loaded with ixs
        //     //  or
        //     //  - transact()
        // }
    }



    let account: {[key: string]: Function;} = {};
    for(let a of idl.accounts){
        const nameCamel = pascalToCamel(a.name);
        account[nameCamel] = async function(addressOrSeeds: Address | []){
            if(Array.isArray(addressOrSeeds)){
                // it's array, assume it's seeds
                const address = await pda(addressOrSeeds);
                return await readAccount(nameCamel, address);
            }else{
                // assume address
                return await readAccount(nameCamel, addressOrSeeds);
            }
        }
    }


    const returns = {
            //on
            on,
            //killEvents
            killEvents,
            //killProgram
            killProgram,

            startSubscription: _subscribeToProgram,

            account,

            pda,
            programId,

        
    }  as {[key: string]: any;};

    if(signer){
        returns.tx = tx;
        // returns.mtx = mtx;
        returns.ix = ixs;
        // returns.txWithAccounts = txs;

    }

    return returns;
}