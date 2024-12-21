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
}

export class NewMessage {
  constructor({ chatId = new ChatId({}), message = new Message({}) }) {
    this.chatId = chatId;
    this.message = message;
  }
}
