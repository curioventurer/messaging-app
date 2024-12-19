import { Message } from "./chat-data";

function sortMessages(messages = [new Message({})]) {
  const sortedMessages = messages.toSorted((a, b) => {
    //if sorting subjects consists of a message(+id) and a sent message(-id), always place message first.
    if (a.id < 0 && b.id > 0) return 1;
    if (a.id > 0 && b.id < 0) return -1;

    /*if sorting same type of message, always place older message first.
      Older message is identified by create time followed by magnitude of id.
    */
    const timeA = new Date(a.created).getTime();
    const timeB = new Date(b.created).getTime();
    const timeDiff = timeA - timeB;

    if (timeDiff !== 0) return timeDiff;
    else return Math.abs(a.id) - Math.abs(b.id);
  });

  return sortedMessages;
}

export default sortMessages;
