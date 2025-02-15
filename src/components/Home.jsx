import { useRouteLoaderData } from "react-router-dom";
import ChatList from "./ChatList";

function Home() {
  const client = useRouteLoaderData("layout");

  return (
    <div className="home">
      <p>
        Welcome <span className="bold">{client.name}</span>, to our messaging
        app!
      </p>
      <ChatList />
    </div>
  );
}

export default Home;
