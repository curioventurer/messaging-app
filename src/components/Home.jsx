import { useRouteLoaderData } from "react-router-dom";
import ChatList from "./ChatList";

function Home() {
  const userData = useRouteLoaderData("layout");

  return (
    <div className="home">
      <p>Welcome {userData.name}, to our messaging app!</p>
      <ChatList />
    </div>
  );
}

export default Home;
