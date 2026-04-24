// TODO: add/copy in as needed



let log =console.log;

import {getProgramDerivedAddress, type Address} from "@solana/kit";
import * as kit from "@solana/kit";

// import { setNetwork } from "./connection.js";
import {browser} from "$app/environment";
// import {createProgram} from "./program.js";
import {scheduleConnect, registerConnectAction, registerDisconnectAction, startConnectSchedule} from "./connectSchedule.js";



export const ZERO_ADDRESS = "11111111111111111111111111111111";


export function integerTypeToSize(type: string){
    return type.substr(1);
}
export function isIntergerType(type: string){
    const types = ["isize","usize"];
    for(let i = 0; i < 8; i++){
        const s = 8 * (2 ** i);
        types.push("u"+s);
        types.push("i"+s);
    }
    return types.includes(type);
}




// Encoders
// export const typeEncoder = (()=>{
//     //TODO: types probably not complete
//
//     // const types =  ["isize","usize"];
//     const types =  ["Address"];
//     for(let i = 0; i < 8; i++){
//         const s = 8 * (2 ** i);
//         types.push("U"+s);
//         types.push("I"+s);
//     }
//     const e = {};
//     for(let T of types){
//         const t = pascalToCamel(T);
//         e[t] = kit[`get${T}Encoder`]();
//     }
//     return e;
// })();
export const typeEncoder = (()=>{
    const types =  ["Address"];

    for(let i = 0; i < 5; i++){
        const s = 8 * (2 ** i);
        types.push("U"+s);
        types.push("I"+s);
    }

    // log(types);

    const e = {} as {[key: string]: any;};
    for(let T of types){
        const t = pascalToCamel(T);
        const functionName: string = `get${T}Encoder`;

        //@ts-ignore
        e[t] = kit[functionName]();
    }
    return e;
})();

export function address(str: string){
    return typeEncoder.address.encode(str);
}
export function camelToSnake(name: string){
    let snaked = "";
    for(let i = 0; i < name.length; i++){
        const s = name[i];
        const l = name[i].toLowerCase();
        if(s === l){
            snaked += s;
        }else{
            snaked += "_"+l;
        }
    }
    return snaked;
}
export function snakeToCamel(name: string){
    const params = name.split("_");
    for(let i = 1; i < params.length; i++){
        const p = params[i];
        params[i] = p.substring(0,1).toUpperCase() + p.substring(1);
    }
    return params.join("");
}
export function pascalToCamel(name: string){
    return name.substring(0,1).toLowerCase()+name.substring(1);
}
export function camelToPascal(name: string){
    return name.substring(0,1).toUpperCase()+name.substring(1);
}
export function snakeToPascal(name: string){
    return camelToPascal(snakeToCamel(name));
}

export function EventSingle(){
    // On event with single callback


    let callback = async ()=>{};

    function onEvent(_callback = (...args: any[]):void => {}){
        //@ts-ignore
        callback = _callback;
        return ()=>{
            //remove callback
            callback = async ()=>{};
        }
    }

    async function triggerEvent(...args: any[]){
        //@ts-ignore
        await callback(...args);
    }

    onEvent.trigger = triggerEvent;
    return onEvent;
}

export function Event(){
    // Forbidden JS
    // returns onEvent function,
    //  this function returns another func which you use to unsubscribe from event
    //  onEvent.triggger(..args) triggers the event


    let cid = 0;
    let callbacks: {[key: string]: Function} = {};

    function onEvent(callback = (...args: any[]):void => {}){
        const _cid = cid++;
        callbacks[_cid] = callback;
        return ()=>{
            //remove callback
            delete callbacks[_cid];
        }
    }

    async function triggerEvent(...args: any[]){
        for(let id in callbacks){
            await callbacks[id](...args);
        }
    }

    function killAll(){
        for(let _cid in callbacks){
            delete callbacks[_cid];
        }
    }

    onEvent.trigger = triggerEvent;
    onEvent.killAll = killAll;

    return onEvent;
}


export async function getPDA(seeds: [], programId: Address){


    let seeds_parsed = [];
    for(let s = 0; s < seeds.length; s++){
        const seed = seeds[s];
        //@ts-ignore
        if(seed.buffer){
            //Assume it's already been encoded (including Address), just add to parsed
            seeds_parsed.push(seed);
        }else if(typeof seed === "string"){
            // Strings just go as is
            seeds_parsed.push(seed);
        }else if(Array.isArray(seed)){
            //@ts-ignore
            if(seed.length !== 2){
                log(seed);
                //@ts-ignore
                throw new Error("Unexpected seed length as Array: "+seed.length);
            }
            const value = seed[0];
            const t = seed[1];
            if(!isIntergerType(t)){
                log(t);
                throw new Error("Not an integer type: "+t);
            }

            seeds_parsed.push(typeEncoder[t].encode(value));
            // if(!isIntegerType)
        }else{
            log(seed);
            throw new Error("Unable to interpret seed: "+seed);
        }
    }

    const [pda, bump] = await getProgramDerivedAddress({
        programAddress: programId,
        //@ts-ignore
        seeds: seeds_parsed
    });
    return pda;
}



export function lamportsToSol(lamports: bigint): string{
    function _trimTail(str: string){
        let clean = "";
        let i = str.indexOf(".");
        if(i === -1){
            return str;
        }
        while(true){
            const last = str.length - 1;
            if(str[last] === "0"){
                if(str[last - 1] !== "."){
                    str = str.substring(0,str.length - 1);
                }else{
                    return str;
                }
            }else{
                return str;
            }

        }
    }
    let str = lamports.toString();
    if(str.length <= 9){
        let pad = 9 - str.length;
        return _trimTail("0."+zeroes(pad)+str);
    }else{
        let head = str.substring(0, str.length - 9);
        if(head.length === 0){
            head = "0"
        }

        const tail = str.substring(head.length);

        return _trimTail(head+"."+tail);
    }

}
export function unitsToTokens(units: bigint): string{
    function _trimTail(str: string){
        let clean = "";
        let i = str.indexOf(".");
        if(i === -1){
            return str;
        }
        while(true){
            const last = str.length - 1;
            if(str[last] === "0"){
                if(str[last - 1] !== "."){
                    str = str.substring(0,str.length - 1);
                }else{
                    return str;
                }
            }else{
                return str;
            }

        }
    }
    let str = units.toString();
    if(str.length <= 6){
        let pad = 6 - str.length;
        return _trimTail("0."+zeroes(pad)+str);
    }else{
        let head = str.substring(0, str.length - 6);
        if(head.length === 0){
            head = "0"
        }

        const tail = str.substring(head.length);
        return _trimTail(head+"."+tail);
    }
}

export function unitsToTokensReadable(units: bigint): string{
    let parsed = unitsToTokens(units);
    let num = Number(parsed);

    if(num < 10){
        return parsed;
    }
    num = Math.round(num);
    if(num < 1000){
        return num.toString()
    }

    if(num < 1_000_000){
        let thousand = Math.round(num / 100)/10;
        return thousand+"k"
    }

    let million = Math.round(num/100_000)/10;
    return million+" Mil"


}
export function roundSol(sol: number): number{
    let lamports = solToLamports(sol);

    let length = lamports.toString().length;

    let shave = (length <= 9)?(9 - length + 3 ):3;

    return Math.floor(sol * (10 ** shave))/(10 ** shave);


}

export function zeroes(length: number): string{
    return "".padEnd(length,"0");
}

export function solToLamports(sol: any){
    let str = sol.toString();
    const decimals = 9;

    let elements = str.split(".");
    if(elements.length === 1){
        return BigInt(elements[0]+ zeroes(9)  )
    }else if(elements[1].length <= 9){
        return BigInt(elements[0]+(elements[1].padEnd(9,"0")))
    }else{
        return BigInt(elements[0]+(elements[1].substring(0,9)) );
    }
}
export function tokensToUnits(tokens: any){
    let str = tokens.toString();
    const decimals = 6;

    let elements = str.split(".");
    if(elements.length === 1){
        return BigInt(elements[0]+ zeroes(decimals)  )
    }else if(elements[1].length <= decimals){
        return BigInt(elements[0]+(elements[1].padEnd(decimals,"0")))
    }else{
        return BigInt(elements[0]+(elements[1].substring(0,decimals)) );
    }
}


export function safeMultiply(num0: number,num1: number){

    if(num0 === 0 &&  num1 === 0) return 0;

    const N = 10 ** 9;
    const lam0 = BigInt(Math.floor(num0 * N));
    const lam1 = BigInt(Math.floor(num1 * N));

    let lam = lam0 * lam1 / (10n ** 9n);
    return Number(lamportsToSol(lam));

}
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function fnv32a() {
    let str = JSON.stringify(arguments);
    let hval = 0x811c9dc5;
    for ( let i = 0; i < str.length; ++i )
    {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    return hval >>> 0;
}

export function now(ms = false){
    let t = BigInt(Date.now());
    if(ms){
        return t;
    }else{
        return t / 1000n;
    }
}



export function parseSeconds(time: bigint){

    function p(str: bigint){
        return String(str).padStart(2,"0");
    }

    let seconds = time % 60n;
    time /= 60n;

    let minutes = time % 60n;
    time /= 60n;

    let hours = time % 24n;
    let days = time / 24n;

    let parsed = p(hours)+":"+p(minutes)+":"+p(seconds);

    if(days){
        parsed = p(days)+parsed;
    }

    return parsed;
}
export function parseMilliseconds(time: bigint){
    let milliseconds = time % 1000n;
    time /= 1000n;

    let ms = String(milliseconds).padStart(3,"0");

    let parsed = parseSeconds(time);

    return parsed +"."+ms;
}

export function isSameKey(key0: any,key1: any){
    return key0.toString() === key1.toString();
}