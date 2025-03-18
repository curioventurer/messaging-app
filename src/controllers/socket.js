import { io } from "socket.io-client";

export const socket = io(undefined, {
  autoConnect: false,
});

export function clearSocket() {
  socket.sendBuffer = [];
  socket._clearAcks();
}
