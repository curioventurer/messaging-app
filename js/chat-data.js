/*Some of the classes that use private variables require special handling for data transfers.
    When stringified for JSON transfer, make sure toJSON method is triggered.
    When spread operator, destructor syntax, and etc is used; call toJSON method.
*/

const DEFAULT_TIME = "1970-01-01T00:00:00.000Z";

/*Zero Width Space (ZWSP)
  Used to prevent display of visible or selectable default text when text is not yet loaded.
  Also prevent the text container from collapsing due to white space collapse.
*/
export const DEFAULT_TEXT = "\u200B";

//class for links in constant.js
export class LinkClass {
  constructor({ href, name, classes = [], search }) {
    this.href = href;
    this.name = name;
    this.classes = classes;
    this.search = search;

    //Generate href for search links.
    for (const key in search) {
      const link = search[key];
      link.href = href + link.param;
    }
  }
}

export class RequestStatus {
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

  static isValid(request) {
    return [this.PENDING, this.ACCEPTED, this.REJECTED].includes(request);
  }
}

/*Describes user activity of a friend.
  Used in socket io emit "friend" event to provide status updates on friends.
*/
export class UserActivity {
  constructor({
    user_id = 0,
    activity = User.ACTIVITY.OFFLINE,
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
  static GUEST_LABEL = "guest_";
  static usernameRegex = "(?!" + this.GUEST_LABEL + ")\\w+";
  static guestUsernameRegex =
    "(?=" + this.GUEST_LABEL + ")\\w{" + (User.GUEST_LABEL.length + 1) + ",}";

  static ACTIVITY = {
    OFFLINE: "offline",
    ONLINE: "online",
    TYPING: "typing",
  };

  #friendship;

  constructor({
    id = 0,
    name = DEFAULT_TEXT,
    password = DEFAULT_TEXT,
    activity = User.ACTIVITY.OFFLINE,
    is_guest = false,
    is_deleted = false,
    last_seen = DEFAULT_TIME,
    created = DEFAULT_TIME,
    friendship = new UserFriendship({}),
  }) {
    this.id = id;
    this.name = name;
    this.password = password;
    this.activity = activity;
    this.is_guest = is_guest;
    this.is_deleted = is_deleted;
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

  //Clear password by setting to default.
  clearPassword() {
    this.password = DEFAULT_TEXT;
  }

  //Clear sensitive data by setting to defaults.
  clearSensitive() {
    this.password = DEFAULT_TEXT;
    this.activity = User.ACTIVITY.OFFLINE;
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

  static isValidUsername(username) {
    if (!this.isValidUsernameFormat(username)) return false;

    if (this.isGuest(username)) return false;

    return true;
  }

  static isValidGuestUsername(username) {
    if (!this.isValidUsernameFormat(username)) return false;

    if (!this.isGuest(username)) return false;

    //At least 1 character after guest label.
    const name = username.slice(this.GUEST_LABEL.length);
    if (name.length < 1) return false;

    return true;
  }

  //guest is identified by a label in front of username.
  static isGuest(username) {
    const label = username.slice(0, this.GUEST_LABEL.length);

    if (label !== this.GUEST_LABEL) return false;

    return true;
  }

  //1-50 word characters (a-z, A-Z, 0-9, _)
  static isValidUsernameFormat(username) {
    if (username.length < 1 || username.length > 50) return false;

    if (!username.match(/^\w+$/)) return false;

    return true;
  }

  //6-30 characters
  static isValidPassword(password) {
    if (password.length < 6 || password.length > 30) return false;

    return true;
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
    state = RequestStatus.PENDING,
    modified = DEFAULT_TIME,
    direct_chat_id = 0,
    sender_id = 0,
    sender_name = DEFAULT_TEXT,
    sender_activity = User.ACTIVITY.OFFLINE,
    sender_last_seen = DEFAULT_TIME,
    receiver_id = 0,
    receiver_name = DEFAULT_TEXT,
    receiver_activity = User.ACTIVITY.OFFLINE,
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
    this.sender_activity = User.ACTIVITY.OFFLINE;
    this.sender_last_seen = DEFAULT_TIME;
    this.receiver_activity = User.ACTIVITY.OFFLINE;
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
    state = RequestStatus.PENDING,
    modified = DEFAULT_TIME,
    direct_chat_id = 0,
    is_initiator = true,
    user_id = 0,
    name = DEFAULT_TEXT,
    activity = User.ACTIVITY.OFFLINE,
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

  isAccepted() {
    return this.state === RequestStatus.ACCEPTED;
  }

  /*To indicate it is not defined anymore, when friendship record is deleted.
    Set all properties to defaults except user_id and name.
  */
  setDefaults() {
    this.id = 0;
    this.state = RequestStatus.PENDING;
    this.modified = DEFAULT_TIME;
    this.direct_chat_id = 0;
    this.is_initiator = true;

    this.clearSensitive();
  }

  //Clear sensitive data(activity and last_seen) for data delivered to non-friends by setting to defaults.
  clearSensitive() {
    this.activity = User.ACTIVITY.OFFLINE;
    this.last_seen = DEFAULT_TIME;
  }

  /*Create object with defaults except for user_id and name.
    For users without friendship record. A default object is used with functions that require friendship argument.
  */
  static createDefault(user_id = 0, name = DEFAULT_TEXT) {
    return new this({ user_id, name });
  }
}

export class Group {
  #membership;

  static nameRegex = "^\\w+$";

  constructor({
    id = 0,
    name = DEFAULT_TEXT,
    is_deleted = false,
    created = DEFAULT_TIME,
    membership = new Member({}),
  }) {
    this.id = id;
    this.name = name;
    this.is_deleted = is_deleted;
    this.created = created;
    this.membership = membership;
  }

  set membership(membership) {
    this.#membership =
      membership instanceof Member ? membership : new Member(membership);
  }
  get membership() {
    return this.#membership;
  }

  //Private variables is hidden from JSON stringify. This exposes it to JSON stringify.
  toJSON() {
    return {
      ...this,
      membership: this.membership,
    };
  }

  //1-50 word characters (a-z, A-Z, 0-9, _)
  static isValidName(name) {
    if (name.length < 1 || name.length > 50) return false;

    if (!name.match(this.nameRegex)) return false;

    return true;
  }

  //groups: contain instances of Group - chat-data.js
  static sortGroups(groups = []) {
    const sortedGroups = groups.toSorted((a, b) => {
      if (a.name < b.name) return -1;
      else return 1;
    });

    return sortedGroups;
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
  static permission = {
    MEMBER: "member",
    ADMIN: "admin",
    OWNER: "owner",
  };

  constructor({
    id = 0,
    group_id = 0,
    user_id = 0,
    name = DEFAULT_TEXT,
    permission = Member.permission.MEMBER,
    state = RequestStatus.PENDING,
    modified = DEFAULT_TIME,
  }) {
    this.id = id;
    this.group_id = group_id;
    this.user_id = user_id;
    this.name = name;
    this.permission = permission;
    this.state = state;
    this.modified = modified;
  }

  //Is the instance defined? If id = 0, indicating defaults, false.
  isDefined() {
    return this.id !== 0;
  }

  getPower() {
    return Member.getPower(this.permission);
  }

  isSameRoom(chatId = new ChatId({})) {
    return chatId.isGroup && chatId.id === this.group_id;
  }

  static getPower(permission = this.permission.MEMBER) {
    switch (permission) {
      case this.permission.MEMBER:
        return 0;
      case this.permission.ADMIN:
        return 1;
      case this.permission.OWNER:
        return 2;
      default:
        return -1;
    }
  }

  /*Filter array of members by member state, and return sorted.
    members: contain instances of Member - chat-data.js
  */
  static filterByState(
    members = [],
    state = RequestStatus.ACCEPTED,
    user_id = 0,
  ) {
    const subset = members.filter((member) => member.state === state);

    if (state === RequestStatus.ACCEPTED)
      return this.sortMembers(subset, user_id);
    else return this.sortApplications(subset);
  }

  /*Sort members by permission level and name.
    The user's entry is placed first.
    members: contain instances of Member - chat-data.js
  */
  static sortMembers(members = [], user_id = 0) {
    //sort members
    const sortedMembers = members.toSorted((a, b) => {
      const perm_diff = this.compare_permission(a, b);
      if (perm_diff !== 0) return perm_diff;

      return this.compare_name(a, b);
    });

    //Place entry for user at the beginning of array.
    const userIndex = sortedMembers.findIndex(
      (member) => member.user_id === user_id,
    );
    if (userIndex !== -1) {
      const user = sortedMembers.splice(userIndex, 1)[0];
      sortedMembers.unshift(user);
    }

    return sortedMembers;
  }

  /*Sort pending/rejected request by modified time and id.
    members: contain instances of Member - chat-data.js
  */
  static sortApplications(members = []) {
    //sort members
    const sortedMembers = members.toSorted((a, b) => {
      return this.compare_time_id(a, b);
    });

    return sortedMembers;
  }

  //compare by desc permission power
  static compare_permission(a, b) {
    const powerA = this.getPower(a.permission);
    const powerB = this.getPower(b.permission);
    const perm_diff = powerB - powerA;

    return perm_diff;
  }

  //compare by asc name.
  static compare_name(a, b) {
    if (a.name < b.name) return -1;
    else if (a.name > b.name) return 1;
    else return 0;
  }

  //compare by desc time(modified).
  static compare_time(a, b) {
    const timeA = new Date(a.modified).getTime();
    const timeB = new Date(b.modified).getTime();
    const time_diff = timeB - timeA;

    return time_diff;
  }

  //compare by desc id.
  static compare_id(a, b) {
    const id_diff = b.id - a.id;
    return id_diff;
  }

  //compare by desc modified time, then desc id.
  static compare_time_id(a, b) {
    const time_diff = this.compare_time(a, b);
    if (time_diff !== 0) return time_diff;
    else return this.compare_id(a, b);
  }
}

export class Message {
  constructor({
    id = 0,
    text = DEFAULT_TEXT,
    created = DEFAULT_TIME,
    user_id = 0,
    name = DEFAULT_TEXT,
    is_deleted = false,
  }) {
    this.id = id;
    this.text = text;
    this.created = created;
    this.user_id = user_id;
    this.name = name;
    this.is_deleted = is_deleted;
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
  static maxLength = 300; //max length of message

  constructor({
    client_id = 0,
    chatId = new ChatId({}),
    message = DEFAULT_TEXT,
  }) {
    this.client_id = client_id;
    this.chatId = chatId;
    this.message = message.slice(0, PostMessage.maxLength); //clip it to max length
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
    membership_modified = DEFAULT_TIME,
    time_shown = DEFAULT_TIME,
    lastMessage = new Message({}),
  }) {
    this.chatId = chatId;
    this.name = name;
    this.user_id = user_id;
    this.membership_modified = membership_modified;
    this.time_shown = time_shown;
    this.lastMessage = lastMessage;
  }

  //more specialized constructor specifying only properties needed for group chat item
  static createGroup({
    chatId = new ChatId({}),
    name = DEFAULT_TEXT,
    membership_modified = DEFAULT_TIME,
    lastMessage = new Message({}),
  }) {
    return new this({ chatId, name, membership_modified, lastMessage });
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

    if (this.chatId.isGroup) return this.membership_modified;
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

export class FormDetail {
  constructor({
    path = "/api/test",
    data = {},
    outputInitial = "Tip: fill in the form",
    outputName = "submission result",
    outputFor = "",
    isSubmitting = false,
    submitButton,
    timeoutDuration = 5000,
    validateInputs = () => true,
    handleSubmitRes = () => {},
    updateIsSubmitting = () => {},
  }) {
    this.path = path;
    this.data = data;
    this.outputInitial = outputInitial;
    this.outputName = outputName;
    this.outputFor = outputFor;
    this.isSubmitting = isSubmitting;
    this.submitButton = submitButton;
    this.timeoutDuration = timeoutDuration;
    this.validateInputs = validateInputs;
    this.handleSubmitRes = handleSubmitRes;
    this.updateIsSubmitting = updateIsSubmitting;
  }
}
