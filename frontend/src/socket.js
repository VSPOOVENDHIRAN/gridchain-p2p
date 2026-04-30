// /src/socket.js
import { io } from "socket.io-client";
const API = process.env.REACT_APP_API_URL;
// Export the base Socket.io manager, but don't connect it yet.
// We will manage the connection state elsewhere.
const socket = io(`${API}`, {
  autoConnect: false, // <--- CRUCIAL CHANGE: PREVENT IMMEDIATE CONNECTION
  reconnection: true,
  // We'll add the 'auth' object later when connecting
});

export default socket;