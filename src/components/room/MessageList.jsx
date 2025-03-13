import { useEffect, useRef, useContext } from "react";
import Loading from "../sys/Loading.jsx";
import LoadFail from "../sys/LoadFail.jsx";
import LoadError from "../sys/LoadError.jsx";
import Message from "./Message.jsx";
import { RoomContext, MessageListContext } from "./Room.jsx";
import DateFormat from "../../controllers/DateFormat.js";

function MessageList() {
  const { chatId } = useContext(RoomContext);
  const messages = useContext(MessageListContext);
  const msgListRef = useRef(null);

  let previousDate = "";
  let previousSender;
  const itemsArray = [];

  /*Scroll list to bottom when scrollbar appears for the first time, and when groupId changes.
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

  const arr = messages ? messages : [];
  for (const msg of arr) {
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

  let content;
  if (messages === undefined)
    content = <Loading name="messages" className="text-center" />;
  else if (messages === null)
    content = <LoadFail name="messages" className="text-center" />;
  else if (messages === false)
    content = <LoadError name="messages" className="text-center" />;
  else if (itemsArray.length === 1)
    content = <p className="no-message">no message</p>;
  else content = itemsArray;

  return (
    <ul ref={msgListRef} className="message-list">
      {content}
    </ul>
  );
}

export default MessageList;
