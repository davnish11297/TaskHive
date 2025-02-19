import { io } from "socket.io-client";

const socket = io("http://localhost:5002", {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    timeout: 5000,
});

socket.on("connect", () => {
    console.log("🟢 WebSocket Connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("🔴 WebSocket Disconnected");
});

export default socket;