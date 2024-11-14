import { useEffect, useState, useRef } from "react";
import { useParams, useLoaderData } from "react-router-dom";
import MessageList from "./MessageList";
import MessagingForm from "./MessagingForm";
import DateFormat from "../controllers/DateFormat.js";
import sortMessages from "../controllers/sortMessages.js";

function ChatRoom() {
  let [messages, setMessages] = useState([]);
  let [room, setRoom] = useState({});
  let [inputMessage, setInputMessage] = useState("");

  /*Provide react key values for sent message.
    Negative values are used to differentiate from normal message.
    The key value is only temporary, it will be replaced with message id from server once sent message is successfully processed by the server.
  */
  const sentKeySeq = useRef(0);
  function getSendKey() {
    return --sentKeySeq.current;
  }

  let { chatId } = useParams();
  chatId = Number(chatId);
  const userData = useLoaderData();

  useEffect(() => {
    fetch("/api/chat/" + chatId)
      .then((res) => res.json())
      .then((data) => {
        setRoom(data.room);
        setMessages(data.messages);
      });

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitMessage(event) {
    event.preventDefault();

    const text = inputMessage;
    setInputMessage("");

    const id = getSendKey();
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id,
        text,
        created: new Date().toISOString(),
        user_id: userData.id,
        username: userData.username,
      },
    ]);

    try {
      const response = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({
          chatId,
          message: text,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      } else {
        const data = await response.json();

        setMessages((prevMessages) => {
          const index = prevMessages.findIndex((msg) => msg.id === id);
          const newMessages = [
            ...prevMessages.slice(0, index),
            data,
            ...prevMessages.slice(index + 1),
          ];
          return sortMessages(newMessages);
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  return (
    <div className="chat-room">
      <h1>{room.name}</h1>
      <p>
        Created on{" "}
        <time dateTime={room.created}>
          {DateFormat.timestamp(room.created)}
        </time>
      </p>
      <MessageList messages={messages} userId={userData.id} />
      <MessagingForm
        message={inputMessage}
        setMessage={setInputMessage}
        submit={submitMessage}
      />
    </div>
  );
}

export default ChatRoom;
