import pool from "./pool.js";

async function registerUser(username, password) {
  await pool.query(
    "INSERT INTO users ( username, password ) VALUES ( $1, $2 )",
    [username, password],
  );
}

async function findUser(username) {
  const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
  return rows[0];
}

async function findUserById(id) {
  console.log("*query - find by id");
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0];
}

async function getChatRooms() {
  const { rows } = await pool.query("SELECT * FROM chat_rooms ORDER BY id");
  return rows;
}

async function findChatRoomById(chatId) {
  const { rows } = await pool.query("SELECT * FROM chat_rooms WHERE id = $1", [
    chatId,
  ]);
  return rows[0];
}

async function getChatMessagesById(chatId, limit = -1) {
  const SQL_MESSAGES = `
    SELECT messages.id, text, messages.created, user_id, username
    FROM messages
    INNER JOIN users
    ON user_id = users.id
    WHERE chat_room_id = $1
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT $2
  `;

  let text = SQL_MESSAGES;
  let values = [chatId, limit];

  //-1 indicates to replace limit parameter with string 'ALL' to select all messages
  if (limit === -1) {
    text = SQL_MESSAGES.replace("$2", "ALL");
    values = values.slice(0, 1);
  }

  const { rows } = await pool.query(text, values);
  return rows.reverse();
}

async function postMessage(chatId, userId, message) {
  await pool.query(
    "INSERT INTO messages ( chat_room_id, user_id, text ) VALUES ( $1, $2, $3 )",
    [chatId, userId, message],
  );

  return await findPostedMessage(chatId, userId, message);
}

async function findPostedMessage(chatId, userId, message) {
  const SQL_FIND = `
    SELECT *
    FROM messages
    WHERE user_id = $2
    AND chat_room_id = $1
    AND text = $3
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT 1
  `;

  const { rows } = await pool.query(SQL_FIND, [chatId, userId, message]);

  return rows[0];
}

export default {
  registerUser,
  findUser,
  findUserById,
  getChatRooms,
  findChatRoomById,
  getChatMessagesById,
  postMessage,
  findPostedMessage,
};
