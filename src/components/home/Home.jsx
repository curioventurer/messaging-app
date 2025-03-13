import { useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HomeNav from "./HomeNav.jsx";
import ChatList from "../chatlist/ChatList.jsx";
import GroupPanel from "../group/GroupPanel.jsx";
import FriendshipPanel from "../friend/FriendshipPanel.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { allLinks } from "../../controllers/constant.js";

function Home() {
  const [searchParams] = useSearchParams();
  const { client } = useContext(InterfaceContext);

  const tabParam = searchParams.get("tab");
  const tabs = allLinks.home.search;
  let content;
  let tab;

  switch (tabParam) {
    case null:
      tab = "";
      content = <ChatList />;
      break;
    case getParam(tabs.group):
      tab = tabParam;
      content = <GroupPanel />;
      break;
    case getParam(tabs.friend):
      tab = tabParam;
      content = <FriendshipPanel />;
      break;
    default:
      tab = "invalid";
      content = <p>Invalid tab</p>;
  }

  function getParam(tab) {
    return tab.param.slice(5);
  }

  return (
    <div className="home">
      <p>
        Welcome <span className="bold">{client.name}</span>, to our messaging
        app! Go to <Link to="/">intro</Link> to access public pages.
      </p>
      <div>
        <HomeNav link_param={tab ? "?tab=" + tab : ""} />
        <div className="content">{content}</div>
      </div>
    </div>
  );
}

export default Home;
