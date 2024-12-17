import { useRouteLoaderData } from "react-router-dom";
import ChatList from "./ChatList";

function Home() {
  const userData = useRouteLoaderData("layout");

  return (
    <>
      <p>Welcome {userData.name}, to our messaging app!</p>
      <ChatList />
    </>
  );
}

export default Home;
