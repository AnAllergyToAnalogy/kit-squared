import {browser} from "$app/environment";

export function readStorage(key: string,defaultVal: any = null){
    return browser ? window.localStorage.getItem(key) ?? defaultVal : defaultVal;
    // return !(!__stored || __stored === "false");
}
export function writeStorage(key: string,value: any){
    localStorage.setItem(key,value);
}
export function clearStorage(key: string){
    localStorage.removeItem(key);
}