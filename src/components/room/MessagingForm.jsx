import { useState, useRef, useContext } from "react";
import { RoomContext } from "./Room";
import { Message, PostMessage } from "../../../js/chat-data.js";

function MessagingForm() {
  const { client, chatId, appendMessage, deleteSentMsg } =
    useContext(RoomContext);

  const [message, setMessage] = useState("");

  /*Provide react key values for sent message.
    Negative values are used to differentiate from normal message.
    The key value is only temporary, it will be replaced with message id from server once sent message is successfully processed by the server.
  */
  const sentMsgSeq = useRef(0);

  function sendMessage(event) {
    event.preventDefault();

    const client_id = --sentMsgSeq.current;

    appendMessage(
      new Message({
        id: client_id,
        text: message,
        created: new Date().toISOString(),
        user_id: client.id,
        name: client.name,
      }),
    );

    const sentMessage = new PostMessage({
      client_id,
      chatId,
      message,
    });

    window.socket.emit("message", sentMessage, deleteSentMsg);

    setMessage("");
  }

  function updateMessage(event) {
    setMessage(event.target.value);
  }

  return (
    <form className="messaging-form" onSubmit={sendMessage}>
      <input
        type="text"
        name="message"
        id="message"
        placeholder="Message"
        aria-label="message"
        maxLength="300"
        value={message}
        onChange={updateMessage}
        autoComplete="off"
        required
        autoFocus
      />
      <button type="submit">Send</button>
    </form>
  );
}

export default MessagingForm;
