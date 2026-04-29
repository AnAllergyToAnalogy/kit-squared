import {writable} from "svelte/store";
import { onWalletConnect, onWalletDisconnect } from "./wallet.js";
import { Event } from "./utils.js";

export const connectIsScheduled = writable(false);
export const disconnectIsScheduled = writable(false);

type Action = "connect" | "disconnect";

let connectQueue: Action[] = [];
let checkingQueue = true; //initially set to false after first init
export function scheduleConnect(action: Action){
    connectQueue.push(action);
    if(connectQueue.length > 1){
        if(([connectQueue[0],connectQueue[1]].sort()).join() === (["connect","disconnect"].sort()).join() ){
            connectQueue.shift();
            connectQueue.shift();
        }
    }
    _checkSchedule();
}


export const onConnect = Event();
export const onDisconnect = Event();

async function _checkSchedule(loopback = false){

    if(checkingQueue && !loopback) return;
    checkingQueue = true;

    if(connectQueue.length !== 0){
        const next = connectQueue.shift();

        connectIsScheduled.set(connectQueue.includes("connect"));
        disconnectIsScheduled.set(connectQueue.includes("disconnect"));

        if(next === "connect"){
            await onConnect.trigger();
        }else if(next === "disconnect"){
            await onDisconnect.trigger();
        }
    }

    if(connectQueue.length !== 0){
        _checkSchedule(true);
    }else{
        checkingQueue = false;
    }
}

export function startConnectSchedule(){
    checkingQueue = false;
    _checkSchedule();
}

onWalletConnect(()=>{
    scheduleConnect("connect");
});
onWalletDisconnect(()=>{
    scheduleConnect("disconnect");
});
