import {writable} from "svelte/store";

let log = console.log;

export const connectIsScheduled = writable(false);
export const disconnectIsScheduled = writable(false);

type Action = "connect" | "disconnect";

let connectQueue: Action[] = [];
let checkingQueue = true; //initially set to false after first init
export function scheduleConnect(action: Action){

    // log("schedule connect:",action);

    connectQueue.push(action);
    if(connectQueue.length > 1){
        if(([connectQueue[0],connectQueue[1]].sort()).join() === (["connect","disconnect"].sort()).join() ){
            connectQueue.shift();
            connectQueue.shift();
        }
    }
    _checkSchedule();
}

let _connectAction = async()=>{};
let _disconnectAction = async()=>{};
export function onConnect(callback = async()=>{}){
    _connectAction = callback;
}
export function onDisconnect(callback = async()=>{}){
    _disconnectAction = callback;
}


async function _checkSchedule(loopback = false){

    // log(". check schedule..")

    if(checkingQueue && !loopback) return;
    checkingQueue = true;

    // log("CHECK!::",connectQueue.length)
    // log();

    if(connectQueue.length !== 0){
        const next = connectQueue.shift();

        connectIsScheduled.set(connectQueue.includes("connect"));
        disconnectIsScheduled.set(connectQueue.includes("disconnect"));

        if(next === "connect"){
            // log(">> Execute scheduled connect");

            await _connectAction();

            // resetData();
            // unsubscribeFromEvents();
            // // program = createProgram(idl,wallet)<CoinPile>;
            // program.set(createProgram(idl,wallet)<CoinPile>);
            // subscribeToEvents(true);
            // await loadInitialData(true);

        }else if(next === "disconnect"){
            log(">> Execute scheduled disconnect");

            await _disconnectAction();

            // resetData();
            // unsubscribeFromEvents();
            // // program = createProgram(idl)<CoinPile>;
            // program.set(createProgram(idl)<CoinPile>);
            // subscribeToEvents(false);
            // await loadInitialData(false);
        }
    }

    if(connectQueue.length !== 0){
        _checkSchedule(true);
    }else{
        checkingQueue = false;
    }
}

export function startConnectSchedule(){
    // log("=== Start Connect Schedule")
    checkingQueue = false;
    _checkSchedule();
}