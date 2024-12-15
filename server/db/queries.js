import pool from "./pool.js";
import { FRIEND_REQUEST_TYPE } from "../../src/controllers/constants.js";

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

async function getUsers(user_id) {
  const SQL_GET_USERS = `
    SELECT id, name, created
    FROM users
    WHERE id != $1
    ORDER BY name
  `;

  const usersPromise = pool.query(SQL_GET_USERS, [user_id]);

  const SQL_GET_FRIENDSHIPS = `
    SELECT id, state, modified, sender_id, receiver_id
    FROM friendships
    WHERE sender_id = $1 OR receiver_id = $1
    ORDER BY state, modified DESC, friendships.id DESC
  `;
  const friendshipsPromise = pool.query(SQL_GET_FRIENDSHIPS, [user_id]);

  const values = await Promise.all([usersPromise, friendshipsPromise]);
  const users = values[0].rows;
  const friendshipArr = values[1].rows;

  for (const friendship of friendshipArr) {
    if (friendship.sender_id === user_id) {
      friendship.user_id = friendship.receiver_id;
      friendship.initiator = true;
    } else {
      friendship.user_id = friendship.sender_id;
      friendship.initiator = false;
    }

    delete friendship.receiver_id;
    delete friendship.sender_id;
  }

  for (const user of users) {
    const friendship = friendshipArr.find(
      (friendship) => friendship.user_id === user.id,
    );
    if (friendship) user.friendship = friendship;
  }

  return users;
}

async function addFriend(sender_id, receiver_id) {
  //verify that the receiver exist
  const receiver = await findUserById(receiver_id);
  if (!receiver) return false;

  //make sure there isn't a previous entry
  const SQL_FIND_ENTRY = `
    SELECT *
    FROM friendships
    WHERE sender_id = $1 AND receiver_id = $2
    OR sender_id = $2 AND receiver_id = $1
  `;
  const entry = await pool.query(SQL_FIND_ENTRY, [sender_id, receiver_id]);
  if (entry.rows[0]) return false;

  const SQL_ADD_FRIEND = `
    INSERT INTO friendships
    ( sender_id, receiver_id )
    VALUES ( $1, $2 )
  `;
  await pool.query(SQL_ADD_FRIEND, [sender_id, receiver_id]);

  const { rows } = await pool.query(SQL_FIND_ENTRY, [sender_id, receiver_id]);
  return rows[0];
}

async function getFriendsByUserId(userId) {
  const SQL_GET_FRIENDS = `
    SELECT friendships.id, state, modified, sender_id, sender.name AS sender, receiver_id, receiver.name AS receiver
    FROM friendships
    INNER JOIN users AS sender ON sender_id = sender.id
    INNER JOIN users AS receiver ON receiver_id = receiver.id
    WHERE sender_id = $1 OR receiver_id = $1
    ORDER BY state, modified DESC, friendships.id DESC
  `;
  const { rows } = await pool.query(SQL_GET_FRIENDS, [userId]);

  for (const friendship of rows) {
    if (friendship.sender_id === userId) {
      friendship.user_id = friendship.receiver_id;
      friendship.name = friendship.receiver;
      friendship.initiator = true;
    } else {
      friendship.user_id = friendship.sender_id;
      friendship.name = friendship.sender;
      friendship.initiator = false;
    }

    delete friendship.receiver_id;
    delete friendship.receiver;
    delete friendship.sender_id;
    delete friendship.sender;
  }

  return rows;
}

async function findFriendshipById(id) {
  const SQL_FIND_FRIENDSHIP = `
    SELECT * 
    FROM friendships
    WHERE id = $1
  `;

  const { rows } = await pool.query(SQL_FIND_FRIENDSHIP, [id]);
  return rows[0];
}

async function setFriendshipStateById(id, state) {
  const SQL_UPDATE_FRIENDSHIP = `
    UPDATE friendships
    SET state = $2
    WHERE id = $1
  `;
  await pool.query(SQL_UPDATE_FRIENDSHIP, [id, state]);
}

async function updateFriendRequest(id, user_id, state) {
  //check validity of state, abort if invalid
  if (!Object.values(FRIEND_REQUEST_TYPE).includes(state)) return false;
  if (state === FRIEND_REQUEST_TYPE.PENDING) return false;

  //search for id, abort if not found
  const friend = await findFriendshipById(id);
  if (!friend) return false;

  //user allowed to modify if user is receiver, else abort
  if (friend.receiver_id !== user_id) return false;

  //if state is no longer pending, abort attempt
  if (friend.state !== FRIEND_REQUEST_TYPE.PENDING) return false;

  await setFriendshipStateById(id, state);

  const updatedFriendship = await findFriendshipById(id);
  return updatedFriendship;
}

async function reverseFriendRequest(id, user_id) {
  //search for id, abort if not found
  const friendship = await findFriendshipById(id);
  if (!friendship) return new Error("friendship id not found");

  //must be a request meant for user, which has been rejected by user. Else abort.
  if (
    !(
      friendship.receiver_id === user_id &&
      friendship.state === FRIEND_REQUEST_TYPE.REJECTED
    )
  )
    return new Error("friendship conditions not valid");

  const SQL_UPDATE_FRIENDSHIP = `
    UPDATE friendships
    SET sender_id = $2,
    receiver_id = $3,
    state = $4
    WHERE id = $1
  `;
  await pool.query(SQL_UPDATE_FRIENDSHIP, [
    id,
    user_id,
    friendship.sender_id,
    FRIEND_REQUEST_TYPE.PENDING,
  ]);

  const updatedFriendship = await findFriendshipById(id);
  return updatedFriendship;
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

export default {
  registerUser,
  findUser,
  findUserById,
  getUsers,
  getFriendsByUserId,
  addFriend,
  findFriendshipById,
  updateFriendRequest,
  reverseFriendRequest,
  getGroups,
  getGroupsByUserId,
  getGroupsSummaryByUserId,
  findGroupById,
  getMembersByGroupId,
  postMessage,
  findPostedMessage,
  getMessagesByGroupId,
};
