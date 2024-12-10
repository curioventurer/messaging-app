import { useEffect, useRef, useContext } from "react";
import Message from "./Message";
import { ChatContext } from "./ChatRoom.jsx";
import DateFormat from "../controllers/DateFormat.js";

function MessageList() {
  const { chatData, chatId } = useContext(ChatContext);

  const msgListRef = useRef(null);

  let previousDate = "";
  let previousSender;
  const itemsArray = [];

  /*Scroll list to bottom when scrollbar appears for the first time, and when chatId changes.
    setInterval checks for scrollbar at DELAY intervals.
    Ensures list starts at bottom, and anchors to css overflow-anchor element when list updates.
  */
  useEffect(() => {
    const elem = msgListRef.current;
    const DELAY = 250;

    const interval = setInterval(() => {
      if (elem.clientHeight !== elem.scrollHeight) {
        elem.scrollTo({ top: elem.scrollHeight });
        clearInterval(interval);
      }
    }, DELAY);

    return () => {
      clearInterval(interval);
    };
  }, [chatId]);

  for (const msg of chatData.messages) {
    const timestamp = new Date(msg.created);
    const msgDate = timestamp.toLocaleDateString();

    if (previousDate !== msgDate) {
      const displayDate = DateFormat.date(msgDate);

      itemsArray.push(
        <li key={msgDate} className="message-date">
          <time dateTime={msgDate}>{displayDate}</time>
        </li>,
      );
    }

    let isJoined = false;
    if (previousSender === msg.user_id && previousDate === msgDate)
      isJoined = true;

    itemsArray.push(<Message key={msg.id} message={msg} isJoined={isJoined} />);

    previousDate = msgDate;
    previousSender = msg.user_id;
  }

  itemsArray.push(<div key="anchor" className="anchor"></div>);

  return (
    <ul ref={msgListRef} className="message-list">
      {itemsArray}
    </ul>
  );
}

export default MessageList;
