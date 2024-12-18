export const PERMISSION_TYPE = ["member", "admin", "owner"];

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
    created = "1970-01-01T00:00:00.000Z",
  }) {
    this.id = id;
    this.name = name;
    this.created = created;
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
