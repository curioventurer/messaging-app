import {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
  createContext,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import useTitle from "../../hooks/useTitle.jsx";
import useSearchState from "../../hooks/useSearchState.jsx";
import useFetchedState from "../../hooks/useFetchedState.jsx";
import ChatList from "../chatlist/ChatList.jsx";
import RoomInfo from "./RoomInfo.jsx";
import RoomUI from "./RoomUI.jsx";
import { InterfaceContext } from "../layout/PrivateInterface.jsx";
import { socket } from "../../controllers/socket.js";
import { clearSocket } from "../../controllers/socket.js";
import { boolType, searchType } from "../../controllers/constant.js";
import {
  DEFAULT_TEXT,
  User,
  ChatId,
  Message,
  NewMessage,
  Group,
  Direct,
  Member,
} from "../../../js/chat-data.js";

/*room: Instance of Group or Direct - chat-data.js
  member: Array containing instances of Member - chat-data.js
  Initialized with undefined to indicate data not yet fetched.
*/
const ROOM_CONTEXT_DEFAULT = {
  client: new User({}),
  chatId: new ChatId({}),
  room: undefined,
  memberList: undefined,
  roomHeader: {},
  appendMessage: function () {},
  deleteSentMsg: function () {},
  updateRoomInfoIsShown: function () {},
  updateRoomInfoIsExpanded: function () {},
};

/*Array containing instances of Message - chat-data.js
  Initialized with undefined to indicate data not yet fetched.
*/
const MESSAGE_LIST_CONTEXT_DEFAULT = undefined;

export const RoomContext = createContext(ROOM_CONTEXT_DEFAULT);
export const MessageListContext = createContext(MESSAGE_LIST_CONTEXT_DEFAULT);

function Room({ isGroup = true, title = false }) {
  const { chat_id } = useParams();
  const { client } = useContext(InterfaceContext);

  const [room, setRoom] = useState(ROOM_CONTEXT_DEFAULT.room);
  const [memberList, setMemberList] = useState(ROOM_CONTEXT_DEFAULT.memberList);
  const [messages, setMessages] = useState(MESSAGE_LIST_CONTEXT_DEFAULT);

  const [roomInfoIsShown, setRoomInfoIsShown] = useSearchState({
    param: "info",
    type: searchType.BOOL,
  });
  const [roomInfoIsExpanded, setRoomInfoIsExpanded] = useSearchState({
    param: "expand-info",
    type: searchType.BOOL,
  });

  const roomHeader = useRef(null);
  const navigate = useNavigate();

  const chatId = useMemo(
    () =>
      new ChatId({
        id: Number(chat_id),
        isGroup,
      }),
    [chat_id, isGroup],
  );
  const apiPath = (chatId.isGroup ? "/api/group/" : "/api/chat/") + chatId.id;

  const clearRoomData = useCallback(function (value = undefined) {
    setRoom(value);
    setMemberList(value);
    setMessages(value);
  }, []);

  const parseRoomData = useCallback(
    function (data) {
      if (data === false) return clearRoomData(false);

      setRoom(chatId.isGroup ? new Group(data.room) : new Direct(data.room));
      setMemberList(
        chatId.isGroup ? data.members.map((member) => new Member(member)) : [],
      );
      setMessages(data.messages.map((msg) => new Message(msg)));
    },
    [chatId, clearRoomData],
  );

  const updateMembership = useCallback(
    function (membershipData = new Member({})) {
      const newMembership = new Member(membershipData);

      //Not an update for this room
      if (!newMembership.isSameRoom(chatId)) return;

      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom;

        const newGroup = new Group({
          ...prevRoom.toJSON(),
          membership: newMembership,
        });

        return newGroup;
      });
    },
    [chatId, setRoom],
  );

  const appendMessage = useCallback(function (message = new Message({})) {
    setMessages((prevMessages) => {
      if (!prevMessages) return prevMessages;

      const newMessages = Message.sortMessages([...prevMessages, message]);
      return newMessages;
    });
  }, []);

  const deleteSentMsg = useCallback(function (clientId) {
    setMessages((prevMessages) => {
      if (!prevMessages) return prevMessages;

      const index = prevMessages.findIndex(
        (message) => message.id === clientId,
      );
      if (index === -1) return prevMessages;

      const newMessages = [
        ...prevMessages.slice(0, index),
        ...prevMessages.slice(index + 1),
      ];
      return newMessages;
    });
  }, []);

  const handleSocketMessage = useCallback(
    function (messageData) {
      const newMessage = new NewMessage({
        chatId: new ChatId(messageData.chatId),
        message: new Message(messageData.message),
      });

      //If same room
      if (newMessage.chatId.isEqual(chatId)) appendMessage(newMessage.message);
    },
    [chatId, appendMessage],
  );

  const updateMember = useCallback(
    function (membershipData = new Member({})) {
      const newMember = new Member(membershipData);

      //Not an update for this room, return.
      if (!newMember.isSameRoom(chatId)) return;

      setMemberList((prevMemberList) => {
        if (!prevMemberList) return prevMemberList;

        const index = prevMemberList.findIndex(
          (member) => member.id === newMember.id,
        );

        let newMemberList;
        if (index === -1) newMemberList = [...prevMemberList, newMember];
        else {
          //for updates, the name is missing from new entry. Add in from preexisting entry.
          const prevMember = prevMemberList[index];
          newMember.name = prevMember.name;

          newMemberList = [
            ...prevMemberList.slice(0, index),
            newMember,
            ...prevMemberList.slice(index + 1),
          ];
        }

        return newMemberList;
      });
    },
    [chatId, setMemberList],
  );

  const deleteMember = useCallback(
    function ({ group_id, membership_id }) {
      const targetChatId = new ChatId({
        id: group_id,
        isGroup: true,
      });

      //Not an update for this room, return.
      if (!chatId.isEqual(targetChatId)) return;

      setMemberList((prevMemberList) => {
        if (!prevMemberList) return prevMemberList;

        const index = prevMemberList.findIndex(
          (member) => member.id === membership_id,
        );
        if (index === -1) return;

        //remove index.
        const newMemberList = [
          ...prevMemberList.slice(0, index),
          ...prevMemberList.slice(index + 1),
        ];

        return newMemberList;
      });
    },
    [chatId, setMemberList],
  );

  //Delete all messages belonging to a user.
  const deleteUserMessages = useCallback(
    function ({ group_id, user_id }) {
      //Not for this room
      if (!chatId.isGroup || chatId.id !== group_id) return;

      setMessages((prevMessages) => {
        if (!prevMessages) return prevMessages;

        //Delete by marking matching messages with deleted status and clearing text value.
        const newMessages = prevMessages.map((message) => {
          if (message.user_id !== user_id) return message;

          return new Message({
            ...message,
            text: "",
            is_deleted: true,
          });
        });

        return newMessages;
      });
    },
    [chatId, setMessages],
  );

  //Redirect to home when the room is deleted by removing friend or leaving group.
  const deleteRoom = useCallback(
    function () {
      navigate("/home", {
        replace: true,
      });
    },
    [navigate],
  );

  const deleteGroupRoom = useCallback(
    function ({ group_id }) {
      const targetChatId = new ChatId({
        id: group_id,
        isGroup: true,
      });

      //if same room, delete room
      if (chatId.isEqual(targetChatId)) deleteRoom();
    },
    [chatId, deleteRoom],
  );

  //if current room shows the direct chat of removed friend, delete room.
  const directChatUserId = chatId.isGroup ? undefined : room?.user_id;
  const deleteDirectRoom = useCallback(
    function ({ user_id }) {
      if (directChatUserId === user_id) deleteRoom();
    },
    [directChatUserId, deleteRoom],
  );

  const updateRoomInfoIsExpanded = useCallback(
    function (type = boolType.TOGGLE) {
      switch (type) {
        case boolType.FALSE:
          if (roomInfoIsExpanded) shrinkRoomInfo();
          break;
        case boolType.TRUE:
          if (!roomInfoIsExpanded) expandRoomInfo();
          break;
        case boolType.TOGGLE:
          if (roomInfoIsExpanded) shrinkRoomInfo();
          else expandRoomInfo();
          break;
      }

      function expandRoomInfo() {
        setRoomInfoIsExpanded(true);
      }

      function shrinkRoomInfo() {
        setRoomInfoIsExpanded(false);
      }
    },
    [roomInfoIsExpanded, setRoomInfoIsExpanded],
  );

  const updateRoomInfoIsShown = useCallback(
    function (type = boolType.TOGGLE) {
      switch (type) {
        case boolType.FALSE:
          if (roomInfoIsShown) closeRoomInfo();
          break;
        case boolType.TRUE:
          if (!roomInfoIsShown) openRoomInfo();
          break;
        case boolType.TOGGLE:
          if (roomInfoIsShown) closeRoomInfo();
          else openRoomInfo();
          break;
      }

      function openRoomInfo() {
        setRoomInfoIsShown(true);
      }

      function closeRoomInfo() {
        /*2 simultaneous updates of searchParams causes 1 to fail to update.
          The 2nd update needs to be delayed with timeout.

          This is a problem with react router's setSearchParams(),
          it does not operate like react's setState() that allows result from previous update to
          carry over to the next update when using callbacks.

          Delay of 0 works, but i don't know if it will work under edge conditions.
          I use a large delay instead to also create an animation like transition.
        */
        if (roomInfoIsExpanded) {
          updateRoomInfoIsExpanded(boolType.FALSE);

          setTimeout(() => {
            setRoomInfoIsShown(false);
            restoreFocus();
          }, 300);
        } else {
          //only 1 update, no need for timeout.
          setRoomInfoIsShown(false);
          restoreFocus();
        }

        //return focus to room header. use timeout to wait for display of room to be restored.
        function restoreFocus() {
          setTimeout(() => {
            roomHeader.current.focus();
          }, 0);
        }
      }
    },
    [
      roomInfoIsShown,
      roomInfoIsExpanded,
      setRoomInfoIsShown,
      updateRoomInfoIsExpanded,
    ],
  );

  const roomName = room ? room.name : DEFAULT_TEXT;
  useTitle((chatId.isGroup ? "Group" : "Chat") + " - " + roomName, !title);

  /*Handle invalid search param.
    If room info is expanded without being shown, set expand to false.
  */
  useEffect(() => {
    if (roomInfoIsExpanded && !roomInfoIsShown) {
      setRoomInfoIsExpanded(false);
    }
  }, [roomInfoIsShown, roomInfoIsExpanded, setRoomInfoIsExpanded]);

  useEffect(() => clearSocket, [chatId]);

  useFetchedState({
    callback: parseRoomData,
    path: apiPath,
    clearState: clearRoomData,
  });

  useEffect(() => {
    socket.on("message", handleSocketMessage);
    socket.on("updateGroupMember", updateMember);
    socket.on("deleteGroupMember", deleteMember);
    socket.on("updateMembership", updateMembership);
    socket.on("deleteMembership", deleteGroupRoom);
    socket.on("deleteFriendship", deleteDirectRoom);
    socket.on("deleteUserMessages", deleteUserMessages);

    return () => {
      socket.off("message", handleSocketMessage);
      socket.off("updateGroupMember", updateMember);
      socket.off("deleteGroupMember", deleteMember);
      socket.off("updateMembership", updateMembership);
      socket.off("deleteMembership", deleteGroupRoom);
      socket.off("deleteFriendship", deleteDirectRoom);
      socket.off("deleteUserMessages", deleteUserMessages);
    };
  }, [
    deleteDirectRoom,
    handleSocketMessage,
    updateMember,
    deleteMember,
    updateMembership,
    deleteGroupRoom,
    deleteUserMessages,
  ]);

  return (
    <div className="room">
      <RoomContext.Provider
        value={useMemo(
          () => ({
            client,
            chatId,
            room,
            memberList,
            roomHeader,
            appendMessage,
            deleteSentMsg,
            updateRoomInfoIsShown,
            updateRoomInfoIsExpanded,
          }),
          [
            client,
            chatId,
            room,
            memberList,
            appendMessage,
            deleteSentMsg,
            updateRoomInfoIsShown,
            updateRoomInfoIsExpanded,
          ],
        )}
      >
        <ChatList className={roomInfoIsShown ? "remove" : ""} />
        <RoomInfo
          className={!roomInfoIsShown ? "remove" : ""}
          roomInfoIsShown={roomInfoIsShown}
          roomInfoIsExpanded={roomInfoIsExpanded}
        />
        <MessageListContext.Provider value={messages}>
          <RoomUI
            className={
              (roomInfoIsExpanded ? "remove" : "") +
              " " +
              (roomInfoIsShown ? "low-priority-display" : "")
            }
          />
        </MessageListContext.Provider>
      </RoomContext.Provider>
    </div>
  );
}

Room.propTypes = {
  isGroup: PropTypes.bool,
  title: PropTypes.bool,
};

export default Room;
