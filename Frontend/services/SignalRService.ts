// // SignalRService.ts
// import * as SignalR from "@microsoft/signalr";

// export let connection: SignalR.HubConnection;

// export const startConnection = async (userId: string, onReceiveMessage: (msg: any) => void) => {
//     connection = new SignalR.HubConnectionBuilder()
//         .withUrl(`http://YOUR_SERVER_IP:5000/chathub?userId=${userId}`)
//         .withAutomaticReconnect()
//         .build();

//     connection.on("ReceiveMessage", onReceiveMessage);
//     connection.on("MessageSent", (msg) => console.log("Message saved:", msg));

//     try { await connection.start(); console.log("Connected to SignalR"); }
//     catch (err) { console.log("Error connecting to SignalR:", err); }
// };

// export const sendMessage = async (msg: any) => {
//     if (connection && connection.state === SignalR.HubConnectionState.Connected) {
//         await connection.invoke("SendMessage", msg);
//     }
// };
