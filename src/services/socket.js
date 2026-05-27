import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin; // Dynamically use the current origin

const socket = io(SOCKET_URL, {
  autoConnect: false
});

export default socket;
