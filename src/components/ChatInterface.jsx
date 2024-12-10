import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessagingForm from "./MessagingForm";

function ChatInterface() {
  return (
    <div className="chat-interface">
      <ChatHeader />
      <MessageList />
      <MessagingForm />
    </div>
  );
}

export default ChatInterface;
