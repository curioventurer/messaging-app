import { useContext } from "react";
import { Link } from "react-router-dom";
import ChatList from "./chatlist/ChatList";
import { InterfaceContext } from "./layout/PrivateInterface";

function Home() {
  const client = useContext(InterfaceContext);

  return (
    <div className="home">
      <p>
        Welcome <span className="bold">{client.name}</span>, to our messaging
        app! Go to <Link to="/">intro</Link> to access public pages.
      </p>
      <ChatList />
    </div>
  );
}

export default Home;
