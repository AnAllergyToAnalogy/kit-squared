import { scheduleConnect } from "./connectSchedule.js";
import { onWalletConnect, onWalletDisconnect } from "./wallet.js";

onWalletConnect(()=>{
    scheduleConnect("connect");
});
onWalletDisconnect(()=>{
    scheduleConnect("disconnect");
});
