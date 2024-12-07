import { useEffect, useState, useRef, createContext } from "react";
import { useParams, useLoaderData } from "react-router-dom";
import ChatList from "./ChatList";
import MessageList from "./MessageList";
import MessagingForm from "./MessagingForm";
import DateFormat from "../controllers/DateFormat.js";
import sortMessages from "../controllers/sortMessages.js";

export const ChatIdContext = createContext(0);

function ChatRoom() {
  let [messages, setMessages] = useState([]);
  let [room, setRoom] = useState({});
  let [inputMessage, setInputMessage] = useState("");

  /*Provide react key values for sent message.
    Negative values are used to differentiate from normal message.
    The key value is only temporary, it will be replaced with message id from server once sent message is successfully processed by the server.
  */
  const sentMsgSeq = useRef(0);

  let { chatId } = useParams();
  chatId = Number(chatId);
  const userData = useLoaderData();

  useEffect(() => {
    function clearSocketSentData() {
      window.socket.sendBuffer = [];
      window.socket._clearAcks();
    }

    return () => {
      clearSocketSentData();
    };
  }, [chatId]);

  useEffect(() => {
    function addToMessages(msg) {
      if (msg.chat_room_id !== chatId) return;

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, msg];
        return sortMessages(newMessages);
      });
    }

    window.socket.on("message", addToMessages);

    return () => {
      window.socket.off("message", addToMessages);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const request = new Request("/api/chat/" + chatId, {
      signal: controller.signal,
    });

    fetch(request)
      .then((res) => res.json())
      .then((data) => {
        setRoom(data.room);
        setMessages(data.messages);
      })
      .catch(() => {});

    return () => {
      controller.abort(
        new Error(
          "FetchAbortError - Fetch request is aborted on component dismount.",
        ),
      );
    };
  }, [chatId]);

  async function submitMessage(event) {
    event.preventDefault();

    const text = inputMessage;
    setInputMessage("");

    const id = --sentMsgSeq.current;

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

    function updateSentMsg(response) {
      setMessages((prevMessages) => {
        const index = prevMessages.findIndex((msg) => msg.id === id);
        const sentMessage = { ...prevMessages[index] };

        sentMessage.id = response.id;
        sentMessage.created = response.created;

        const newMessages = [
          ...prevMessages.slice(0, index),
          sentMessage,
          ...prevMessages.slice(index + 1),
        ];

        return sortMessages(newMessages);
      });
    }

    window.socket.emit(
      "message",
      {
        id,
        chatId,
        message: text,
      },
      updateSentMsg,
    );
  }

  return (
    <div className="chat-room">
      <ChatIdContext.Provider value={chatId}>
        <ChatList />
      </ChatIdContext.Provider>
      <div className="chat-interface">
        <h1>{room.name}</h1>
        <p>
          Created on{" "}
          <time dateTime={room.created}>
            {DateFormat.timestamp(room.created)}
          </time>
        </p>
        <MessageList messages={messages} userId={userData.id} chatId={chatId} />
        <MessagingForm
          message={inputMessage}
          setMessage={setInputMessage}
          submit={submitMessage}
        />
      </div>
    </div>
  );
}

export default ChatRoom;
