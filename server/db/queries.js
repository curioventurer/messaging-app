import pool from "./pool.js";

async function registerUser(name, password) {
  await pool.query("INSERT INTO users ( name, password ) VALUES ( $1, $2 )", [
    name,
    password,
  ]);
}

async function findUser(name) {
  const { rows } = await pool.query("SELECT * FROM users WHERE name = $1", [
    name,
  ]);
  return rows[0];
}

async function findUserById(id) {
  console.log("*query - find by id");
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0];
}

async function getGroups() {
  const { rows } = await pool.query("SELECT * FROM groups ORDER BY name");
  return rows;
}

async function getGroupsByUserId(userId) {
  const SQL_GET_GROUPS = `
    SELECT groups.id, name, groups.created, permission, memberships.created as joined
    FROM groups
    INNER JOIN memberships
    ON groups.id = group_id
    WHERE user_id = $1
    ORDER BY groups.name
  `;
  const { rows } = await pool.query(SQL_GET_GROUPS, [userId]);
  return rows;
}

async function getGroupsSummaryByUserId(userId) {
  const groups = await getGroupsByUserId(userId);
  const promises = [];

  for (const group of groups) {
    promises.push(
      getMessagesByGroupId(group.id, 1).then((messages) => {
        group.lastMessage = messages[0];
      }),
    );
  }
  await Promise.all(promises);

  return groups;
}

async function findGroupById(groupId) {
  const { rows } = await pool.query("SELECT * FROM groups WHERE id = $1", [
    groupId,
  ]);
  return rows[0];
}

async function getMessagesByGroupId(groupId, limit = -1) {
  const SQL_GET_MESSAGES = `
    SELECT messages.id, text, messages.created, user_id, name
    FROM messages
    INNER JOIN users
    ON user_id = users.id
    WHERE group_id = $1
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT $2
  `;

  let text = SQL_GET_MESSAGES;
  let values = [groupId, limit];

  //-1 indicates to replace limit parameter with string 'ALL' to select all messages
  if (limit === -1) {
    text = SQL_GET_MESSAGES.replace("$2", "ALL");
    values = values.slice(0, 1);
  }

  const { rows } = await pool.query(text, values);
  return rows.reverse();
}

async function getMembersByGroupId(groupId) {
  const SQL_GET_MEMBERS = `
    SELECT memberships.id, user_id, name, permission, memberships.created
    FROM memberships
    INNER JOIN users
    ON user_id = users.id
    WHERE group_id = $1
    ORDER BY permission DESC, name
  `;
  const { rows } = await pool.query(SQL_GET_MEMBERS, [groupId]);
  return rows;
}

async function postMessage(groupId, userId, message) {
  await pool.query(
    "INSERT INTO messages ( group_id, user_id, text ) VALUES ( $1, $2, $3 )",
    [groupId, userId, message],
  );

  return await findPostedMessage(groupId, userId, message);
}

async function findPostedMessage(groupId, userId, message) {
  const SQL_FIND_MESSAGE = `
    SELECT *
    FROM messages
    WHERE user_id = $2
    AND group_id = $1
    AND text = $3
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT 1
  `;

  const { rows } = await pool.query(SQL_FIND_MESSAGE, [
    groupId,
    userId,
    message,
  ]);

  return rows[0];
}

export default {
  registerUser,
  findUser,
  findUserById,
  getGroups,
  getGroupsByUserId,
  getGroupsSummaryByUserId,
  findGroupById,
  getMessagesByGroupId,
  getMembersByGroupId,
  postMessage,
  findPostedMessage,
};
