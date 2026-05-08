import { writable, type Writable } from "svelte/store";
import { browser } from "$app/environment";


// Import Program IDL and ProgramClient
import * as idl from "$lib/config/example_program.json";
import * as programClient from "$lib/config/exampleProgram/src/generated";

import {
    addAccounts,
    clearAddedAccounts,
    createProgram,    init,
    isMe,
    onConnect,
    onDisconnect,
   
    signer,
    transact,
// } from "kit-squared";
} from "../../../src/lib";




// Use free RPCs
const http = "https://api.devnet.solana.com";
const ws = "wss://api.devnet.solana.com";
const network = "devnet";

let program:  {[key: string]: any};

function registerEvents(){
    program.on("someEvent", (eventData: any,slotNumber: bigint,signature: string)=>{
        console.log("someEvent")
        const {someKey, someU64} = eventData;

        if(isMe(someKey)){
            alert(`You created an account. someU64: ${someU64}`);
        }
        

    });
    
    program.on("someOtherEvent", (eventData: any,slotNumber: bigint,signature: string)=>{
        console.log("someOtherEvent")
        const {someKey, someU64, someU32, someBool} = eventData;

        if(isMe(someKey)){
            alert(`You updated an account. someU64: ${someU64}, someU32: ${someU32}.`);
        }

    });

}
function killOldProgram(){
    program.killEvents();
    
}

let killOnConnect: Function, killOnDisconnect: Function;
async function initialise(){
    init(http,ws,network);

    program = await createProgram(programClient,idl, signer);
    registerEvents();

    killOnConnect = onConnect(async ()=>{
        console.log("wallet connected")

        killOldProgram();

        // Replace program helper with wallet-enabled version
        program = await createProgram(programClient,idl,signer);

        registerEvents();

    })
    killOnDisconnect = onDisconnect(async()=>{
        console.log("wallet disconnected")

        killOldProgram();

        program = await createProgram(programClient,idl);

        registerEvents();

    });


    // Read account 0 at startup
    readAccountAndUpdateStore(0);
}

// Unsubscribe everything, put this in page unmount
export function uninitialise(){
    killOldProgram();
    killOnConnect();
    killOnDisconnect();
}

if(browser){
    initialise();
}


// Store with some data to be displayed
export const readAccountData: Writable<null | {[key: string]: any}> = writable(null);

// Function to read an account and then update the above store with the response
export async function readAccountAndUpdateStore(accountNumber: any){
    if(!program) return;
    const data = await _readSomeAccount(accountNumber);

    readAccountData.set(data);
}

// Internal function for reading accounts based on a provided account number
async function _readSomeAccount(accountNumber: any){
    const accountAddress = await program.pda(
        [
            "someSeed",
            [BigInt(accountNumber), "u64"]
        ]
    );
    return await program.account.someAccount(accountAddress);
}


// Check if account exists and if not, execute createAccount tx
export async function createAccount(accountNumber: any){

    //First check if it exists already
    const data =  await _readSomeAccount(accountNumber);

    // If it exists, then stop doing the tx
    if(data){
        alert("An Account with this account number already exists.")
        return;
    }

    // do the tx
    await program.tx.createAccount(accountNumber);
}


// Check if account exists, and if so, execute updateAccount tx with params
export async function updateAccount(accountNumber: any, someU32: any, someU64: any, someBool: any){

    //First check if it exists
    const data =  await _readSomeAccount(accountNumber);

    // If it exists, then stop doing the tx
    if(!data){
        alert("This account does not exist yet")
        return;
    }

    clearAddedAccounts();


    const accountAddress = await program.pda(
        [
            "someSeed",
            [BigInt(accountNumber), "u64"]
        ]
    );

    // Add the account to update since it can't be inferred by params
    addAccounts({
        toUpdate: accountAddress
    });

    // Do the tx
    await program.tx.updateAccount(someU32, someU64, someBool);
}



// Check if either of these two accounts exist, and if they both dont exist, execute a single tx that will include two createAccount ixs
export async function createTwoAccounts(accountNumber0: any, accountNumber1: any){

    //Check if first account exists already
    const data0 =  await _readSomeAccount(accountNumber0);

    // If it exists, then stop doing the tx
    if(data0){
        alert(`An Account with number ${accountNumber0} already exists.`);
        return;
    }

    
    //Check if second account exists already
    const data1 =  await _readSomeAccount(accountNumber1);

    // If it exists, then stop doing the tx
    if(data1){
        alert(`An Account with number ${accountNumber1} already exists.`);
        return;
    }

    // Build the IXs
    const ix0 =  await program.ix.createAccount(accountNumber0);
    const ix1 =  await program.ix.createAccount(accountNumber1);

    // Send TX
    await transact([ix0,ix1])

}
