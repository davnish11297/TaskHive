import { io } from "socket.io-client";

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : 'http://localhost:5001';

const socket = io(SOCKET_URL, {
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