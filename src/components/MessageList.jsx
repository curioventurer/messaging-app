import { useEffect, useRef, useContext } from "react";
import Loading from "./Loading";
import LoadFail from "./LoadFail";
import LoadError from "./LoadError";
import Message from "./Message";
import { RoomContext, ChatContext } from "./Room";
import DateFormat from "../../controllers/DateFormat.js";

function MessageList() {
  const { chatId } = useContext(RoomContext);
  const { chatData } = useContext(ChatContext);
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

  const messages = chatData ? chatData.messages : [];
  for (const msg of messages) {
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
  if (chatData === undefined)
    content = <Loading name="messages" className="text-center" />;
  else if (chatData === null)
    content = <LoadFail name="messages" className="text-center" />;
  else if (chatData === false)
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
