// place files you want to import through the `$lib` alias in this folder.


import * as idl from "$lib/config/example_program.json";
import * as programClient from "$lib/config/exampleProgram/src/generated";
import { writable } from "svelte/store";

import {
    createProgram,
    // scheduleConnect,
    // registerConnectAction,
    // registerDisconnectAction,
    // startConnectSchedule,
    // connectIsScheduled, disconnectIsScheduled
    init,
    onConnect,
    onDisconnect
} from "kit-squared";


import { browser } from "$app/environment";

// Use free RPCs
const http = "https://api.devnet.solana.com";
const ws = "wss://api.devnet.solana.com";
const network = "devnet";

let program;

async function initialise(){
    init(http,ws,network);

    program = await createProgram(programClient,idl,null, true);

    onConnect(async ()=>{
        console.log("wallet connected")
    })
    onDisconnect(async()=>{
        console.log("wallet disconnected")
    });
}

if(browser){
    initialise();
}