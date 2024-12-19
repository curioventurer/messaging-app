import { useState, useRef, useContext } from "react";
import { GroupContext } from "./Room.jsx";
import { Message, PostMessage } from "../controllers/chat-data.js";

function MessagingForm() {
  const { userData, isGroupChat, chat_id, appendMessage, deleteSentMsg } =
    useContext(GroupContext);

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
        user_id: userData.id,
        name: userData.name,
      }),
    );

    const sentMessage = new PostMessage({
      client_id,
      chat_id,
      isGroupChat,
      message,
    });

    window.socket.emit("message", sentMessage, deleteSentMsg);

    setMessage("");
  }

  function updateInput(event) {
    setMessage(event.target.value);
  }

  return (
    <form className="messaging-form" onSubmit={sendMessage}>
      <input
        type="text"
        name="message"
        id="messageInput"
        placeholder="Message"
        value={message}
        onChange={updateInput}
        autoFocus
      />
      <button>Send</button>
    </form>
  );
}

export default MessagingForm;
