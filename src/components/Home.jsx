import { useRouteLoaderData } from "react-router-dom";
import GroupList from "./GroupList";

function Home() {
  const userData = useRouteLoaderData("layout");

  return (
    <>
      <p>Welcome {userData.name}, to our messaging app!</p>
      <GroupList />
    </>
  );
}

export default Home;
