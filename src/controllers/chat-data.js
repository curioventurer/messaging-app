/*Some of the classes that use private variables require special handling for data transfers.
    When stringified for JSON transfer, make sure toJSON method is triggered.
    When spread operator, destructor syntax, and etc is used; call toJSON method.
*/

const DEFAULT_TIME = "1970-01-01T00:00:00.000Z";

/*Zero Width Space (ZWSP)
  Used to prevent display of visible or selectable default text when text is not yet loaded.
  Also prevent the text container from collapsing due to white space collapse.
*/
const DEFAULT_TEXT = "\u200B";

export class FriendRequest {
  static PENDING = "pending";
  static ACCEPTED = "accepted";
  static REJECTED = "rejected";

  static getOrder(request = this.PENDING) {
    switch (request) {
      case this.PENDING:
        return 0;
      case this.ACCEPTED:
        return 1;
      case this.REJECTED:
        return 2;
      default:
        return -1;
    }
  }

  static isRequestValid(request) {
    return [this.PENDING, this.ACCEPTED, this.REJECTED].includes(request);
  }
}

/*Describes user activity of a friend.
  Used in socket io emit "friend" event to provide status updates on friends.
*/
export class UserActivity {
  constructor({
    user_id = 0,
    activity = User.ACTIVITY_TYPE.OFFLINE,
    last_seen = new Date().toISOString(),
  }) {
    this.user_id = user_id;
    this.activity = activity;
    this.last_seen = last_seen;
  }
}

export class ChatId {
  constructor({ id = 0, isGroup = true }) {
    this.id = id;
    this.isGroup = isGroup;
  }

  //is the object's values the same?
  isEqual(chatId = new ChatId({})) {
    if (this.id === chatId.id && this.isGroup === chatId.isGroup) return true;
    else return false;
  }
}

export class User {
  static ACTIVITY_TYPE = {
    OFFLINE: "offline",
    ONLINE: "online",
    TYPING: "typing",
  };

  #friendship;

  constructor({
    id = 0,
    name = DEFAULT_TEXT,
    password = DEFAULT_TEXT,
    activity = User.ACTIVITY_TYPE.OFFLINE,
    last_seen = DEFAULT_TIME,
    created = DEFAULT_TIME,
    friendship = new UserFriendship({}),
  }) {
    this.id = id;
    this.name = name;
    this.password = password;
    this.activity = activity;
    this.last_seen = last_seen;
    this.created = created;
    this.friendship = friendship;

    this.fillFriendship();
  }

  set friendship(friendship) {
    this.#friendship =
      friendship instanceof UserFriendship
        ? friendship
        : new UserFriendship(friendship);
  }
  get friendship() {
    return this.#friendship;
  }

  //Fill friendship with values, if currently using defaults.
  fillFriendship() {
    //If not defined(defaults values are used)
    if (!this.friendship.isDefined()) {
      this.friendship.name = this.name;
      this.friendship.user_id = this.id;
    }
  }

  //Clear sensitive data by setting to defaults.
  clearSensitive() {
    this.password = DEFAULT_TEXT;
    this.activity = User.ACTIVITY_TYPE.OFFLINE;
    this.last_seen = DEFAULT_TIME;
  }

  //Private variables is hidden from JSON stringify. This exposes it to JSON stringify.
  toJSON() {
    return {
      ...this,
      friendship: this.friendship,
    };
  }

  //users: contain instances of User - chat-data.js
  static sortUsers(users = []) {
    const sortedUsers = users.toSorted((a, b) => {
      if (a.name < b.name) return -1;
      else return 1;
    });

    return sortedUsers;
  }
}

/*Describe the relation between 2 users,
  and provide relevant data on both users.

  Used in database queries.

  id: the id of the relation
  state: state of relation(pending/accepted/rejected friend request)
  modified: time of last change of the relation
  direct_chat_id: id of direct chat between users

  sender: the user that send the friend request
  receiver: the user that receives the friend request

  <user>_id, name, activity, last_seen: relevant data on the users
*/
export class Friendship {
  constructor({
    id = 0,
    state = FriendRequest.PENDING,
    modified = DEFAULT_TIME,
    direct_chat_id = 0,
    sender_id = 0,
    sender_name = DEFAULT_TEXT,
    sender_activity = User.ACTIVITY_TYPE.OFFLINE,
    sender_last_seen = DEFAULT_TIME,
    receiver_id = 0,
    receiver_name = DEFAULT_TEXT,
    receiver_activity = User.ACTIVITY_TYPE.OFFLINE,
    receiver_last_seen = DEFAULT_TIME,
  }) {
    this.id = id;
    this.state = state;
    this.modified = modified;
    this.direct_chat_id = direct_chat_id;
    this.sender_id = sender_id;
    this.sender_name = sender_name;
    this.sender_activity = sender_activity;
    this.sender_last_seen = sender_last_seen;
    this.receiver_id = receiver_id;
    this.receiver_name = receiver_name;
    this.receiver_activity = receiver_activity;
    this.receiver_last_seen = receiver_last_seen;
  }

  /*Create instances of UserFriendship used for sending friendship data to users.
    This is used as each user only needs info on the other user, and not themselves.
    Each UserFriendship instance describes only 1 user.

    For each user, 1 instance describing the user is created to be sent to the other user.
  */
  getUserFriendship(isForSender = true) {
    const userFriendship = new UserFriendship({
      id: this.id,
      state: this.state,
      modified: this.modified,
      direct_chat_id: this.direct_chat_id,
      is_initiator: !isForSender,
      user_id: isForSender ? this.receiver_id : this.sender_id,
      name: isForSender ? this.receiver_name : this.sender_name,
      activity: isForSender ? this.receiver_activity : this.sender_activity,
      last_seen: isForSender ? this.receiver_last_seen : this.sender_last_seen,
    });

    return userFriendship;
  }

  //Clear sensitive data(activity and last_seen) for data delivered to non-friends by setting to defaults.
  clearSensitive() {
    this.sender_activity = User.ACTIVITY_TYPE.OFFLINE;
    this.sender_last_seen = DEFAULT_TIME;
    this.receiver_activity = User.ACTIVITY_TYPE.OFFLINE;
    this.receiver_last_seen = DEFAULT_TIME;
  }

  //reverse the sender/receiver roles.
  reverseInitiator() {
    let temp;

    temp = this.sender_id;
    this.sender_id = this.receiver_id;
    this.receiver_id = temp;

    temp = this.sender_name;
    this.sender_name = this.receiver_name;
    this.receiver_name = temp;

    temp = this.sender_activity;
    this.sender_activity = this.receiver_activity;
    this.receiver_activity = temp;

    temp = this.sender_last_seen;
    this.sender_last_seen = this.receiver_last_seen;
    this.receiver_last_seen = temp;
  }
}

/*Describe the relation of the user with the client,
  and provide relevant data on the user.

  Used in client UI.

  id: the id of the relation
  state: state of relation(pending/accepted/rejected friend request)
  modified: time of last change of the relation
  direct_chat_id: id of direct chat between user and client
  is_initiator: the user is the initiator of the friend request

  user_id, name, activity, last_seen: relevant data on the user
*/
export class UserFriendship {
  constructor({
    id = 0,
    state = FriendRequest.PENDING,
    modified = DEFAULT_TIME,
    direct_chat_id = 0,
    is_initiator = true,
    user_id = 0,
    name = DEFAULT_TEXT,
    activity = User.ACTIVITY_TYPE.OFFLINE,
    last_seen = DEFAULT_TIME,
  }) {
    this.id = id;
    this.state = state;
    this.modified = modified;
    this.direct_chat_id = direct_chat_id;
    this.is_initiator = is_initiator;
    this.user_id = user_id;
    this.name = name;
    this.activity = activity;
    this.last_seen = last_seen;
  }

  //Is the instance defined? If id = 0, indicating defaults, false.
  isDefined() {
    return this.id !== 0;
  }

  /*To indicate it is not defined anymore, when friendship record is deleted.
    Set all properties to defaults except user_id and name.
  */
  setDefaults() {
    this.id = 0;
    this.state = FriendRequest.PENDING;
    this.modified = DEFAULT_TIME;
    this.direct_chat_id = 0;
    this.is_initiator = true;

    this.clearSensitive();
  }

  //Clear sensitive data(activity and last_seen) for data delivered to non-friends by setting to defaults.
  clearSensitive() {
    this.activity = User.ACTIVITY_TYPE.OFFLINE;
    this.last_seen = DEFAULT_TIME;
  }
}

export class ChatData {
  //messages: contain instances of Message - chat-data.js
  //members: contain instances of Member - chat-data.js
  constructor({
    isGroup = true,
    messages = [],
    group = new Group({}),
    direct = new Direct({}),
    members = [],
  }) {
    this.isGroup = isGroup;
    this.messages = messages;
    this.group = group;
    this.direct = direct;
    this.members = members;
  }
}

export class Group {
  constructor({ id = 0, name = DEFAULT_TEXT, created = DEFAULT_TIME }) {
    this.id = id;
    this.name = name;
    this.created = created;
  }
}

export class Direct {
  constructor({
    id = 0,
    name = DEFAULT_TEXT,
    user_id = 0,
    time_shown = DEFAULT_TIME,
  }) {
    this.id = id;
    this.name = name;
    this.user_id = user_id;
    this.time_shown = time_shown;
  }
}

export class Member {
  static PERMISSION_TYPE = ["member", "admin", "owner"];

  constructor({
    id = 0,
    user_id = 0,
    name = DEFAULT_TEXT,
    permission = Member.PERMISSION_TYPE[0],
    created = DEFAULT_TIME,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.permission = permission;
    this.created = created;
  }

  //members: contain instances of Member - chat-data.js
  static sortMembers(members = [], user_id = 0) {
    const sortedMembers = members.toSorted((a, b) => {
      const powerA = this.PERMISSION_TYPE.indexOf(a.permission);
      const powerB = this.PERMISSION_TYPE.indexOf(b.permission);
      const powerDiff = powerB - powerA;
      if (powerDiff !== 0) return powerDiff;

      if (a.name > b.name) return 1;
      else if (a.name < b.name) return -1;
      else return 0;
    });

    const userIndex = sortedMembers.findIndex(
      (member) => member.user_id === user_id,
    );
    if (userIndex !== -1) {
      const user = sortedMembers.splice(userIndex, 1)[0];
      sortedMembers.unshift(user);
    }

    return sortedMembers;
  }
}

export class Message {
  constructor({
    id = 0,
    text = DEFAULT_TEXT,
    created = DEFAULT_TIME,
    user_id = 0,
    name = DEFAULT_TEXT,
  }) {
    this.id = id;
    this.text = text;
    this.created = created;
    this.user_id = user_id;
    this.name = name;
  }

  //Is the instance defined? If id = 0, indicating defaults, false.
  isDefined() {
    return this.id !== 0;
  }

  //messages: contain instances of Message - chat-data.js
  static sortMessages(messages = []) {
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
}

export class PostMessage {
  constructor({
    client_id = 0,
    chatId = new ChatId({}),
    message = DEFAULT_TEXT,
  }) {
    this.client_id = client_id;
    this.chatId = chatId;
    this.message = message;
  }

  static isValid(data) {
    if (!(data instanceof Object)) return false;

    if (!Number.isSafeInteger(data.client_id)) return false;
    if (typeof data.message !== "string") return false;

    if (!(data.chatId instanceof Object)) return false;
    if (!Number.isSafeInteger(data.chatId.id)) return false;
    if (typeof data.chatId.isGroup !== "boolean") return false;

    return true;
  }
}

export class NewMessage {
  constructor({ chatId = new ChatId({}), message = new Message({}) }) {
    this.chatId = chatId;
    this.message = message;
  }
}

export class ChatItemData {
  #chatId;
  #lastMessage;

  constructor({
    chatId = new ChatId({}),
    name = DEFAULT_TEXT,
    user_id = 0,
    joined = DEFAULT_TIME,
    time_shown = DEFAULT_TIME,
    lastMessage = new Message({}),
  }) {
    this.chatId = chatId;
    this.name = name;
    this.user_id = user_id;
    this.joined = joined;
    this.time_shown = time_shown;
    this.lastMessage = lastMessage;
  }

  //more specialized constructor specifying only properties needed for group chat item
  static createGroup({
    chatId = new ChatId({}),
    name = DEFAULT_TEXT,
    joined = DEFAULT_TIME,
    lastMessage = new Message({}),
  }) {
    return new this({ chatId, name, joined, lastMessage });
  }

  //more specialized constructor specifying only properties needed for direct chat item
  static createDirect({
    chatId = new ChatId({}),
    name = DEFAULT_TEXT,
    user_id = 0,
    time_shown = DEFAULT_TIME,
    lastMessage = new Message({}),
  }) {
    return new this({ chatId, name, user_id, time_shown, lastMessage });
  }

  set lastMessage(lastMessage) {
    this.#lastMessage =
      lastMessage instanceof Message ? lastMessage : new Message(lastMessage);
  }
  get lastMessage() {
    return this.#lastMessage;
  }

  set chatId(chatId) {
    this.#chatId = chatId instanceof ChatId ? chatId : new ChatId(chatId);
  }
  get chatId() {
    return this.#chatId;
  }

  /*Select time representing chat item,
    based on whether last message is defined,
    and if this is a group chat or direct chat.
  */
  selectTime() {
    //if last message is not default, use last message time
    if (this.lastMessage.isDefined()) return this.lastMessage.created;

    if (this.chatId.isGroup) return this.joined;
    else return this.time_shown;
  }

  //get epoch for selectTime()
  getEpoch() {
    const epoch = new Date(this.selectTime()).getTime();
    return epoch;
  }

  //Private variables is hidden from JSON stringify. This exposes it to JSON stringify.
  toJSON() {
    return {
      ...this,
      chatId: this.chatId,
      lastMessage: this.lastMessage,
    };
  }

  //chats: contain instances of ChatItemData - chat-data.js
  static sortChats(chats = []) {
    const sortedChats = chats.toSorted((a, b) => {
      //Sort by new item first, using time.
      const timeA = a.getEpoch();
      const timeB = b.getEpoch();
      const timeDiff = timeB - timeA;

      return timeDiff;
    });

    return sortedChats;
  }
}
