import { useRouteLoaderData } from "react-router-dom";
import ChatList from "./ChatList";

function Home() {
  const client = useRouteLoaderData("layout");

  return (
    <div className="home">
      <p>Welcome {client.name}, to our messaging app!</p>
      <ChatList />
    </div>
  );
}

export default Home;
