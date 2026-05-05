// place files you want to import through the `$lib` alias in this folder.

let log = console.log;
import * as idl from "$lib/config/example_program.json";

import * as programClient from "$lib/config/exampleProgram/src/generated";
// console.log(programClient);
// import * as programClient2 from "$lib/config/hormuzRun/src/generated";
// console.log(programClient2);


import { writable, type Writable } from "svelte/store";

import {
    createProgram,
    // scheduleConnect,
    // registerConnectAction,
    // registerDisconnectAction,
    // startConnectSchedule,
    // connectIsScheduled, disconnectIsScheduled
    init,
    onConnect,
    onDisconnect,
   
    signer,
// } from "kit-squared";
} from "../../../src/lib";


import { browser } from "$app/environment";

// Use free RPCs
const http = "https://api.devnet.solana.com";
const ws = "wss://api.devnet.solana.com";
const network = "devnet";

let program:  {[key: string]: any};

function registerEvents(){
    program.on("someEvent", (eventData: any,slotNumber: bigint,signature: string)=>{
        log("someEvent")
        // log(eventData,slotNumber,signature);
    });
    
    program.on("someOtherEvent", (eventData: any,slotNumber: bigint,signature: string)=>{
        log("someOtherEvent")
        // log(eventData,slotNumber,signature;
    });

}
function killEvents(){
    program.killEvents();
}

async function initialise(){
    init(http,ws,network);

    log(signer)
    program = await createProgram(programClient,idl, signer);
    registerEvents();



    onConnect(async ()=>{
        killEvents();
        console.log("wallet connected")

        // Replace program helper with wallet-enabled version
        program = await createProgram(programClient,idl,signer);

        log(program);

        registerEvents();

    })
    onDisconnect(async()=>{
        killEvents();

        console.log("wallet disconnected")

        program = await createProgram(programClient,idl);

        registerEvents();

    });


    // Register events

    readAccount(0);
}

if(browser){
    initialise();
}


export const readAccountData: Writable<null | {[key: string]: any}> = writable(null);
export async function readAccount(accountNumber: any){
    if(!program) return;
    const accountAddress = await program.pda(
        [
            "someSeed",
            [BigInt(accountNumber), "u64"]
        ]
    );

    const data = await program.account.someAccount(accountAddress);

    readAccountData.set(data);

}

export async function createAccount(accountNumber: any){
    log(program)
    await program.tx.createAccount(accountNumber);
}

