export const PERMISSION_TYPE = ["member", "admin", "owner"];

export class ChatId {
  constructor({ id = 0, isGroup = true }) {
    this.id = id;
    this.isGroup = isGroup;
  }
}

export class ChatData {
  constructor({
    isGroup = true,
    messages = [new Message({})],
    group = new Group({}),
    direct = new Direct({}),
    members = [new Member({})],
  }) {
    this.isGroup = isGroup;
    this.messages = messages;
    this.group = group;
    this.direct = direct;
    this.members = members;
  }
}

export class Group {
  constructor({
    id = 0,
    name = "default_name",
    created = "1970-01-01T00:00:00.000Z",
  }) {
    this.id = id;
    this.name = name;
    this.created = created;
  }
}

export class Direct {
  constructor({
    id = 0,
    name = "default_name",
    user_id = 0,
    time_shown = "1970-01-01T00:00:00.000Z",
  }) {
    this.id = id;
    this.name = name;
    this.user_id = user_id;
    this.time_shown = time_shown;
  }
}

export class Member {
  constructor({
    id = 0,
    user_id = 0,
    name = "default_name",
    permission = PERMISSION_TYPE[0],
    created = "1970-01-01T00:00:00.000Z",
  }) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.permission = permission;
    this.created = created;
  }
}

export class Message {
  constructor({
    id = 0,
    text = "default_text",
    created = "1970-01-01T00:00:00.000Z",
    user_id = 0,
    name = "default_name",
  }) {
    this.id = id;
    this.text = text;
    this.created = created;
    this.user_id = user_id;
    this.name = name;
  }
}

export class PostMessage {
  constructor({
    client_id = 0,
    chatId = new ChatId({}),
    message = "default_message",
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
    name = "default_name",
    user_id = 0,
    joined = "1970-01-01T00:00:00.000Z",
    time_shown = "1970-01-01T00:00:00.000Z",
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
    name = "default_name",
    joined = "1970-01-01T00:00:00.000Z",
    lastMessage = new Message({}),
  }) {
    return new this({ chatId, name, joined, lastMessage });
  }

  //more specialized constructor specifying only properties needed for direct chat item
  static createDirect({
    chatId = new ChatId({}),
    name = "default_name",
    user_id = 0,
    time_shown = "1970-01-01T00:00:00.000Z",
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
    if (this.lastMessage.id !== 0) return this.lastMessage.created;

    if (this.chatId.isGroup) return this.joined;
    else return this.time_shown;
  }

  //get epoch for selectTime()
  getEpoch() {
    const epoch = new Date(this.selectTime()).getTime();
    return epoch;
  }

  toJSON() {
    return {
      ...this,
      chatId: this.chatId,
      lastMessage: this.lastMessage,
    };
  }

  static sortChats(chats = [new this({})]) {
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
