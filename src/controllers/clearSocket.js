export default function clearSocket() {
  window.socket.sendBuffer = [];
  window.socket._clearAcks();
}
