import pool from "./pool.js";
import bcrypt from "bcrypt";
import {
  ChatId,
  Message,
  PostMessage,
  NewMessage,
  Group,
  Direct,
  Member,
  ChatItemData,
  User,
  Friendship,
  RequestStatus,
  UserFriendship,
} from "../../js/chat-data.js";

async function registerUser(name, password) {
  const saltRounds = 12;

  try {
    if (!User.isValidUsername(name))
      return { info: { message: "invalid username" } };

    if (!User.isValidPassword(password))
      return { info: { message: "invalid password" } };

    const existingUser = await findUser(name);
    if (existingUser) return { info: { message: "username taken" } };

    const hash = bcrypt.hashSync(password, saltRounds);

    const { rows } = await pool.query(
      "INSERT INTO users ( name, password ) VALUES ( $1, $2 ) RETURNING id, name, created",
      [name, hash],
    );
    const response = rows[0];

    if (response) {
      return { user: new User(response) };
    } else {
      return { info: { message: "database returning failure" } };
    }
  } catch (err) {
    return { err };
  }
}

async function registerGuest(name) {
  try {
    if (!User.isValidGuestUsername(name))
      return { info: { message: "invalid username" } };

    const existingUser = await findUser(name);
    if (existingUser) return { info: { message: "username taken" } };

    const { rows } = await pool.query(
      "INSERT INTO users ( name, password, is_guest ) VALUES ( $1, $2, TRUE ) RETURNING id, name, created",
      [name, "guest"],
    );
    const response = rows[0];

    if (response) {
      return { user: new User({ ...response, is_guest: true }) };
    } else {
      return { info: { message: "database returning failure" } };
    }
  } catch (err) {
    return { err };
  }
}

/*Used only for login authentication, and user registration.
  Retrieve user info(with password) using username.
*/
async function findUser(name) {
  const { rows } = await pool.query(
    "SELECT id, name, password, activity, is_guest, last_seen, created FROM users WHERE name = $1",
    [name],
  );
  const response = rows[0];

  if (response) {
    return new User(response);
  } else return false;
}

//Retrieve user info(except password) using user_id.
async function findUserById(id) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, activity, is_guest, last_seen, created FROM users WHERE id = $1",
      [id],
    );
    const response = rows[0];

    if (response) {
      return new User(response);
    } else return false;
  } catch {
    return false;
  }
}

async function getUsers(user_id) {
  const SQL_GET_USERS = `
    SELECT id, name, is_guest, created
    FROM users
    WHERE id != $1
    ORDER BY name
  `;
  const usersPromise = pool.query(SQL_GET_USERS, [user_id]);

  const friendshipsPromise = getFriendships(user_id);

  const values = await Promise.all([usersPromise, friendshipsPromise]);
  const users = values[0].rows.map((user) => new User(user));
  const friendshipArr = values[1];

  for (const user of users) {
    const friendship = friendshipArr.find(
      (friendship) => friendship.user_id === user.id,
    );

    if (friendship) user.friendship = friendship;
  }

  return users;
}

async function putUserActivity(id = 0, activity = User.ACTIVITY.OFFLINE) {
  const SQL_PUT_ACTIVITY = `
    UPDATE users
    SET activity = $2
    WHERE id = $1
  `;

  //if going offline, update last_seen and return the time value
  const SQL_PUT_OFFLINE = `
    UPDATE users
    SET activity = $2
    , last_seen = default
    WHERE id = $1
    RETURNING last_seen
  `;

  let sql;
  if (activity === User.ACTIVITY.OFFLINE) sql = SQL_PUT_OFFLINE;
  else sql = SQL_PUT_ACTIVITY;

  const { rows } = await pool.query(sql, [id, activity]);
  const response = rows[0];
  return response?.last_seen;
}

async function deleteFriendship(friendship_id) {
  await pool.query("DELETE FROM friendship_agents WHERE friendship_id=$1", [
    friendship_id,
  ]);
  await pool.query("DELETE FROM friendships WHERE id=$1", [friendship_id]);
}

async function deleteDirectChat(direct_chat_id) {
  await pool.query("DELETE FROM direct_chat_agents WHERE direct_chat_id=$1", [
    direct_chat_id,
  ]);
  await pool.query("DELETE FROM messages WHERE direct_chat_id=$1", [
    direct_chat_id,
  ]);
  await pool.query("DELETE FROM direct_chats WHERE id=$1", [direct_chat_id]);
}

/*Verify validity of adding friend, then create pending friend request.
  Returns friendship data if successful.
  Returns false if database queries fails or arguments invalid.
*/
async function addFriend(user_id, other_id) {
  if (user_id === other_id) return false; //Must not reference yourself

  //verify that the other user exist
  const other_user = await findUserById(other_id);
  if (!other_user) return false;

  //make sure there isn't a previous entry
  const SQL_FIND_ENTRY = `
    SELECT TRUE
    FROM friendship_agents AS agent1
    INNER JOIN friendship_agents AS agent2 ON agent1.friendship_id = agent2.friendship_id
    WHERE agent1.user_id = $1
    AND agent2.user_id = $2
  `;
  const entry = await pool.query(SQL_FIND_ENTRY, [user_id, other_id]);
  if (entry.rows[0]) return false;

  return await postFriendship(user_id, other_id);
}

/*Create pending friend request with sender and receiver user id.
  Returns friendship data if successful.
  Returns false if database queries fails.
*/
async function postFriendship(sender_id = 0, receiver_id = 0) {
  //create record in friendships, returning id.
  const SQL_POST_FRIENDSHIP = `
    INSERT INTO friendships
    VALUES ( DEFAULT )
    RETURNING id
  `;
  const friendship_id = (await pool.query(SQL_POST_FRIENDSHIP)).rows[0]?.id;
  if (!friendship_id) return false; //insert failure

  //create 2 agents with specified friendship_id.
  async function postFriendshipAgents(
    friendship_id = 0,
    sender_id = 0,
    receiver_id = 0,
  ) {
    const SQL_POST_FRIENDSHIP_AGENT = `
      INSERT INTO friendship_agents
      ( friendship_id, user_id, is_initiator )
      VALUES ( $1, $2, TRUE ),
      ( $1, $3, FALSE )
    `;
    await pool.query(SQL_POST_FRIENDSHIP_AGENT, [
      friendship_id,
      sender_id,
      receiver_id,
    ]);
  }
  await postFriendshipAgents(friendship_id, sender_id, receiver_id);

  //get friendship data after completion of insertions.
  const friendship = await findFriendshipById(friendship_id);

  if (friendship) {
    friendship.clearSensitive();
    return friendship;
  } else return false;
}

/*Get all friendships of the client based on arguments.

  user_id: client's user_id
  state: friendship state. If default("all"), get all friendship states.

  Returns array of UserFriendship instance.
*/
async function getFriendships(user_id, state = "all") {
  /*Returns the requested records, but it is incomplete.
    Returned record needs to be filled with data from other queries.
  */
  async function getRecords(user_id, state = "all") {
    const SQL_GET_FRIENDSHIPS = `
      SELECT friendships.id, friendships.state, friendships.modified, agent2.is_initiator, agent2.user_id, users.name, users.activity, users.last_seen
      FROM friendships
      INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendship_id
      INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendship_id
      INNER JOIN users ON agent2.user_id = users.id
      WHERE agent1.user_id = $1
      AND agent2.user_id != $1
      <state_condition>
      ORDER BY friendships.state, friendships.modified DESC, friendships.id DESC
    `;

    let sql;
    let inputs = [user_id, state];

    /*Get all friendship states.
      Remove state from inputs array, and remove condition placeholder from sql.
    */
    if (state === "all") {
      sql = SQL_GET_FRIENDSHIPS.replace("<state_condition>", "");
      inputs = inputs.slice(0, 1);
    }
    //Replace condition placeholder with condition statement in sql.
    else
      sql = SQL_GET_FRIENDSHIPS.replace(
        "<state_condition>",
        "AND friendships.state = $2",
      );

    const { rows } = await pool.query(sql, inputs);
    const friendships = rows.map(
      (friendship) => new UserFriendship(friendship),
    );

    return friendships;
  }

  const friendshipsPromise = getRecords(user_id, state);
  const directChatsPromise = getDirectChats(user_id);
  const values = await Promise.all([directChatsPromise, friendshipsPromise]);
  const directArr = values[0];
  const friendshipArr = values[1];

  friendshipArr.forEach((friendship) => {
    //Add in direct_chat_id if info is found.
    const direct = directArr.find(
      (direct) => direct.user_id === friendship.user_id,
    );
    if (direct) friendship.direct_chat_id = direct.id;

    //if not friends, delete sensitive info meant for friends
    if (friendship.state !== RequestStatus.ACCEPTED)
      friendship.clearSensitive();
  });

  return friendshipArr;
}

/*Find friendships by friendship_id
  
  Returns Friendship instance.
  Returns false if not found.
*/
async function findFriendshipById(friendship_id = 0) {
  const SQL_FIND_FRIENDSHIP = `
    SELECT friendships.id, friendships.state, friendships.modified,
      user1.id AS sender_id, user1.name AS sender_name,
      user1.activity AS sender_activity, user1.last_seen AS sender_last_seen,
      user2.id AS receiver_id, user2.name AS receiver_name,
      user2.activity AS receiver_activity, user2.last_seen AS receiver_last_seen
    FROM friendships
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendship_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendship_id
    INNER JOIN users AS user1 ON agent1.user_id = user1.id
    INNER JOIN users AS user2 ON agent2.user_id = user2.id
    WHERE friendships.id = $1
    AND agent1.is_initiator = TRUE
    AND agent2.is_initiator = FALSE
  `;
  try {
    const { rows } = await pool.query(SQL_FIND_FRIENDSHIP, [friendship_id]);

    if (rows[0]) return new Friendship(rows[0]);
    else return false;
  } catch {
    return false;
  }
}

async function setFriendshipStateById(id, state) {
  const SQL_UPDATE_FRIENDSHIP = `
    UPDATE friendships
    SET state = $2
    WHERE id = $1
    RETURNING state, modified
  `;
  const { rows } = await pool.query(SQL_UPDATE_FRIENDSHIP, [id, state]);
  return rows[0];
}

/*Add the user whose friend request you previously rejected.
  
  Because the friendship record created by the previous request still exists,
  the query won't create a new friendship record,
  instead it will switch the initiators and reset the state to pending.
  
  Hence, the need for this specific query instead of using the add friend query.

  It effectively reverses the previous friend request,
  reversing the roles(sender/receiver of friend request) of the users,
  hence the choice of naming.
*/
async function reverseFriendRequest(id, user_id) {
  //search for id, abort if not found
  const friendship = await findFriendshipById(id);
  if (!friendship) return new Error("friendship id not found");

  //must be a request meant for user, which has been rejected by user. Else abort.
  if (
    !(
      friendship.receiver_id === user_id &&
      friendship.state === RequestStatus.REJECTED
    )
  )
    return new Error("friendship conditions not valid");

  const setStatePromise = setFriendshipStateById(id, RequestStatus.PENDING);

  const SQL_INVERT_INITIATOR = `
    UPDATE friendship_agents
    SET is_initiator = NOT is_initiator
    WHERE friendship_id = $1
  `;
  const invertPromise = pool.query(SQL_INVERT_INITIATOR, [id]);

  const values = await Promise.all([setStatePromise, invertPromise]);
  const update = values[0];

  if (update) {
    //update the friendship object with new values from query update
    friendship.state = update.state;
    friendship.modified = update.modified;
    friendship.reverseInitiator();

    friendship.clearSensitive();

    return friendship;
  } else return new Error("return from update failed");
}

async function findDirectChatByUserId(user_id, other_id) {
  const SQL_FIND_DIRECT = `
    SELECT agent1.direct_chat_id AS id, agent1.is_shown
    FROM direct_chat_agents AS agent1
    INNER JOIN direct_chat_agents AS agent2 ON agent1.direct_chat_id = agent2.direct_chat_id
    WHERE agent1.user_id = $1
    AND agent2.user_id = $2
  `;
  const { rows } = await pool.query(SQL_FIND_DIRECT, [user_id, other_id]);
  if (rows[0]) return rows[0];
  else return false;
}

async function openDirectChat(user_id, other_id) {
  if (user_id === other_id) return false; //Must not reference yourself

  //search for preexisting direct chat, and show it if found.
  try {
    const direct = await findDirectChatByUserId(user_id, other_id);
    if (direct) {
      if (direct.is_shown === false)
        await showDirectChat(
          new ChatId({ id: direct.id, isGroup: false }),
          user_id,
        );

      return direct.id;
    }
  } catch {
    return false;
  }

  //direct chat not found, create a new one.
  const SQL_FIND_FRIENDSHIP = `
    SELECT friendships.state
    FROM friendships
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendship_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendship_id
    WHERE agent1.user_id = $1
    AND agent2.user_id = $2
  `;
  const friendship = (
    await pool.query(SQL_FIND_FRIENDSHIP, [user_id, other_id])
  ).rows[0];

  //Friendship not found, or not friends. Abort
  if (friendship?.state !== RequestStatus.ACCEPTED) return false;

  const direct_chat_id = await createDirectChat(user_id, other_id);
  return direct_chat_id;
}

async function createDirectChat(user_id, other_id) {
  const newDirect = (
    await pool.query("INSERT INTO direct_chats VALUES ( DEFAULT ) returning id")
  ).rows[0];
  if (!newDirect) return false; //Database insert failure

  const SQL_CREATE_DIRECT = `
    INSERT INTO direct_chat_agents
    ( direct_chat_id, user_id, is_shown, time_shown )
    VALUES
    ( $1, $2, TRUE, CURRENT_TIMESTAMP),
    ( $1, $3, DEFAULT, DEFAULT)
  `;
  await pool.query(SQL_CREATE_DIRECT, [newDirect.id, user_id, other_id]);

  return newDirect.id;
}

async function showDirectChat(chatId = new ChatId({}), user_id) {
  const SQL_SHOW_DIRECT = `
    UPDATE direct_chat_agents
    SET is_shown = TRUE,
    time_shown = CURRENT_TIMESTAMP
    WHERE direct_chat_id = $1
    AND user_id = $2
  `;
  await pool.query(SQL_SHOW_DIRECT, [chatId.id, user_id]);
}

async function hideDirectChat(chatId = new ChatId({}), user_id) {
  const SQL_HIDE_DIRECT = `
    UPDATE direct_chat_agents
    SET is_shown = FALSE
    WHERE direct_chat_id = $1
    AND user_id = $2
  `;
  try {
    await pool.query(SQL_HIDE_DIRECT, [chatId.id, user_id]);
    return true;
  } catch {
    return false;
  }
}

async function findDirectChatShown(chatId = new ChatId({}), user_id) {
  const SQL_SHOW_DIRECT = `
    SELECT is_shown
    FROM direct_chat_agents
    WHERE direct_chat_id = $1
    AND user_id = $2
  `;
  const { rows } = await pool.query(SQL_SHOW_DIRECT, [chatId.id, user_id]);
  return rows[0]?.is_shown;
}

/*Get memberships of the user depending on state.
  membership_state = "all" to specify retrieving all states.
*/
async function getMemberships(
  user_id,
  membership_state = RequestStatus.ACCEPTED,
) {
  const isAll = membership_state === "all";

  const SQL_GET_GROUPS = `
    SELECT id, group_id, permission, state, modified
    FROM memberships

    WHERE user_id = $1
    ${isAll ? "" : "AND state = $2"}

    ORDER BY id;
  `;

  const values = [user_id, membership_state];
  if (isAll) values.pop();

  const { rows } = await pool.query(SQL_GET_GROUPS, values);

  return rows.map((member) => new Member(member));
}

/*I call it summaries to distinguish it from other group queries,
  as it generates list of user's groups with last message appended
*/
async function getGroupSummaries(user_id) {
  const SQL_GET_GROUPS = `
    SELECT DISTINCT ON (groups.id)
    
    groups.id, groups.name, memberships.modified AS mem_modified,

    messages.id AS msg_id, messages.text AS msg_text, messages.created AS msg_created, messages.user_id AS msg_user_id, users.name AS msg_name
    
    FROM groups
    
    INNER JOIN memberships
    ON groups.id = memberships.group_id
    
    INNER JOIN messages
    ON groups.id = messages.group_id
    
    INNER JOIN users
    ON messages.user_id = users.id

    WHERE memberships.user_id = $1
    AND memberships.state = '${RequestStatus.ACCEPTED}'

    ORDER BY groups.id, messages.created DESC, messages.id DESC;
  `;
  const { rows } = await pool.query(SQL_GET_GROUPS, [user_id]);

  const groups = rows.map((group) =>
    ChatItemData.createGroup({
      chatId: new ChatId({
        id: group.id,
        isGroup: true,
      }),
      name: group.name,
      membership_modified: group.mem_modified,
      lastMessage: new Message({
        id: group.msg_id,
        text: group.msg_text,
        created: group.msg_created,
        user_id: group.msg_user_id,
        name: group.msg_name,
      }),
    }),
  );

  return groups;
}

async function getDirectSummaries(user_id) {
  const SQL_GET_DIRECT_CHATS = `
    SELECT DISTINCT ON (agent1.direct_chat_id)
    
    agent1.direct_chat_id AS id, users.name, users.id AS user_id, agent1.time_shown,

    messages.id AS msg_id, messages.text AS msg_text, messages.created AS msg_created, messages.user_id AS msg_user_id, msg_user.name AS msg_name
    
    FROM direct_chat_agents AS agent1
    
    INNER JOIN direct_chat_agents AS agent2
    ON agent1.direct_chat_id = agent2.direct_chat_id
    
    INNER JOIN users
    ON agent2.user_id = users.id

    INNER JOIN messages
    ON agent1.direct_chat_id = messages.direct_chat_id
    
    INNER JOIN users AS msg_user
    ON messages.user_id = msg_user.id
    
    WHERE agent1.user_id = $1
    AND agent2.user_id != $1
    AND agent1.is_shown = TRUE
    
    ORDER BY agent1.direct_chat_id, messages.created DESC, messages.id DESC;
  `;
  const { rows } = await pool.query(SQL_GET_DIRECT_CHATS, [user_id]);

  const directs = rows.map((direct) =>
    ChatItemData.createDirect({
      chatId: new ChatId({
        id: direct.id,
        isGroup: false,
      }),
      name: direct.name,
      user_id: direct.user_id,
      time_shown: direct.time_shown,
      lastMessage: new Message({
        id: direct.msg_id,
        text: direct.msg_text,
        created: direct.msg_created,
        user_id: direct.msg_user_id,
        name: direct.msg_name,
      }),
    }),
  );

  return directs;
}

async function getDirectChats(user_id) {
  const SQL_GET_DIRECT_CHATS = `
    SELECT agent1.direct_chat_id AS id, users.name, users.id AS user_id, agent1.time_shown
    
    FROM direct_chat_agents AS agent1
    
    INNER JOIN direct_chat_agents AS agent2
    ON agent1.direct_chat_id = agent2.direct_chat_id
    
    INNER JOIN users
    ON agent2.user_id = users.id
    
    WHERE agent1.user_id = $1
    AND agent1.is_shown = TRUE
    AND agent2.user_id != $1;
  `;

  const { rows } = await pool.query(SQL_GET_DIRECT_CHATS, [user_id]);
  return rows.map((direct) => new Direct(direct));
}

//Retrieves groups that linked to user's memberships.
async function getUserGroups(user_id) {
  const SQL_GET_GROUPS = `
    SELECT groups.id, groups.name, groups.created,
    memberships.id AS mem_id, memberships.permission, memberships.state, memberships.modified
    
    FROM groups

    INNER JOIN memberships
    ON groups.id = memberships.group_id

    WHERE memberships.user_id = $1
    ORDER BY memberships.state, groups.name;
  `;

  const { rows } = await pool.query(SQL_GET_GROUPS, [user_id]);

  const groups = rows.map((group) => {
    return new Group({
      id: group.id,
      name: group.name,
      created: group.created,
      membership: new Member({
        id: group.mem_id,
        permission: group.permission,
        state: group.state,
        modified: group.modified,
      }),
    });
  });

  return groups;
}

//Retrieves all groups
async function getGroups(user_id) {
  const SQL_GET_GROUPS = `
    SELECT id, name, created
    FROM groups
    ORDER BY name;
  `;

  const groupsPromise = pool.query(SQL_GET_GROUPS);
  const membershipsPromise = getMemberships(user_id, "all");
  const values = await Promise.all([groupsPromise, membershipsPromise]);

  const groups = values[0].rows.map((group) => new Group(group));
  const memberships = values[1];

  groups.forEach((group) => {
    const membership = memberships.find(
      (membership) => membership.group_id === group.id,
    );
    if (membership) group.membership = membership;
  });

  return groups;
}

async function findGroupById(groupId) {
  const { rows } = await pool.query(
    "SELECT id, name, created FROM groups WHERE id = $1",
    [groupId],
  );
  return rows[0] ? new Group(rows[0]) : false;
}

async function getMembersByGroupId(groupId) {
  const SQL_GET_MEMBERS = `
    SELECT memberships.id, users.id AS user_id, users.name, memberships.permission, memberships.state, memberships.modified

    FROM memberships
    
    INNER JOIN users
    ON memberships.user_id = users.id
    
    WHERE memberships.group_id = $1
    ORDER BY memberships.state, memberships.permission DESC, users.name
  `;
  try {
    const { rows } = await pool.query(SQL_GET_MEMBERS, [groupId]);
    const members = rows.map((row) => new Member(row));
    return members;
  } catch {
    return false;
  }
}

async function findMembership(group_id, user_id) {
  const SQL_FIND_MEMBERSHIP = `
    SELECT id, group_id, user_id, permission, state, modified
    FROM memberships
    
    WHERE group_id = $1
    AND user_id = $2
  `;
  try {
    const { rows } = await pool.query(SQL_FIND_MEMBERSHIP, [group_id, user_id]);
    const entry = rows[0];

    if (!entry) return false;
    else return new Member(entry);
  } catch {
    return false;
  }
}

async function findMembershipById(id) {
  const SQL_FIND_MEMBERSHIP = `
    SELECT id, group_id, user_id, permission, state, modified
    FROM memberships

    WHERE id = $1
  `;
  try {
    const { rows } = await pool.query(SQL_FIND_MEMBERSHIP, [id]);
    const entry = rows[0];

    if (!entry) return false;
    else return new Member(entry);
  } catch {
    return false;
  }
}

async function postMembership(group_id, user_id) {
  try {
    const SQL_POST_MEMBERSHIP = `
      INSERT INTO memberships
      ( group_id, user_id)
      VALUES ( $1, $2 )
      RETURNING id, group_id, user_id, permission, state, modified;
    `;

    //return false, if membership already exists.
    const membership = await findMembership(group_id, user_id);
    if (membership) return false;

    const { rows } = await pool.query(SQL_POST_MEMBERSHIP, [group_id, user_id]);
    const entry = rows[0];

    if (!entry) return false;
    else return new Member(entry);
  } catch {
    return false;
  }
}

async function deleteGroupApplication(group_id, user_id) {
  const SQL_DELETE_MEMBERSHIP = `
    DELETE FROM memberships
    
    WHERE group_id = $1
    AND user_id = $2
    AND state = '${RequestStatus.PENDING}'
    
    RETURNING id, group_id, user_id, permission, state, modified;
  `;
  try {
    const { rows } = await pool.query(SQL_DELETE_MEMBERSHIP, [
      group_id,
      user_id,
    ]);
    const entry = rows[0];

    if (!entry) return false;
    else return new Member(entry);
  } catch {
    return false;
  }
}

async function putMemberRequest(id, state, user_id) {
  try {
    const SQL_PUT_MEMBERSHIP = `
      UPDATE memberships
      SET state = $2
      WHERE id = $1
      RETURNING id, group_id, user_id, permission, state, modified;
    `;

    //return false, if state isn't accepted or rejected.
    if (state !== RequestStatus.ACCEPTED && state !== RequestStatus.REJECTED)
      return false;

    //First, determine if membership can be modified. It must a pending or rejected request.

    //return false, if membership does not exists.
    const membership = await findMembershipById(id);
    if (!membership) return false;

    //return false, if membership is accepted.
    if (membership.state === RequestStatus.ACCEPTED) return false;

    /*Current strategy is such that, pending request can be accepted/rejected.
      While already rejected request can only be accepted.
      Therefore, there is still a need to validate specifically for rejected request.
    */
    if (
      membership.state === RequestStatus.REJECTED &&
      state === RequestStatus.REJECTED
    )
      return false;

    //Next, determine if user has the permission to update(accept/reject) the membership request. User must be at least admin in the group.

    //return false, if membership does not exists.
    const userMembership = await findMembership(membership.group_id, user_id);
    if (!userMembership) return false;

    //return false, if user is not at least admin
    if (userMembership.getPower() < 1) return false;

    //All test has passed, now proceed to put the request.
    const { rows } = await pool.query(SQL_PUT_MEMBERSHIP, [id, state]);
    const entry = rows[0];

    if (!entry) return false;
    else return new Member(entry);
  } catch {
    return false;
  }
}

async function leaveGroup(id, user_id) {
  const SQL_DELETE_MEMBERSHIP = `
    DELETE FROM memberships
    
    WHERE id = $1
    AND user_id = $2
    AND state = '${RequestStatus.ACCEPTED}'
    AND NOT permission = '${Member.permission.OWNER}'
    
    RETURNING id, group_id, user_id, permission, state, modified;
  `;
  try {
    const { rows } = await pool.query(SQL_DELETE_MEMBERSHIP, [id, user_id]);
    const entry = rows[0];

    if (!entry) return false;
    else return new Member(entry);
  } catch {
    return false;
  }
}

async function kickMember(id, user_id) {
  const SQL_DELETE_MEMBERSHIP = `
    DELETE FROM memberships

    WHERE id = $1

    RETURNING id, group_id, user_id, permission, state, modified;
  `;
  try {
    //return false, if membership does not exists.
    const membership = await findMembershipById(id);
    if (!membership) return false;

    //return false, if not an accepted member.
    if (membership.state !== RequestStatus.ACCEPTED) return false;

    //return false, if membership does not exists.
    const userMembership = await findMembership(membership.group_id, user_id);
    if (!userMembership) return false;

    //return false, if not an accepted member.
    if (userMembership.state !== RequestStatus.ACCEPTED) return false;

    //Can only kick if user's power is greater than member.
    if (membership.getPower() >= userMembership.getPower()) return false;

    //All checks passed, proceed to kick.
    const { rows } = await pool.query(SQL_DELETE_MEMBERSHIP, [id]);
    const entry = rows[0];

    if (!entry) return false;
    else return new Member(entry);
  } catch {
    return false;
  }
}

async function postMessage(user_id = 0, postMessage = new PostMessage({})) {
  const SQL_POST_MESSAGE = `
    INSERT INTO messages
    ( group_id, user_id, text )
    VALUES ( $1, $2, $3 )
    RETURNING id, text, group_id, direct_chat_id, user_id, created
  `;

  let sql;
  if (postMessage.chatId.isGroup) sql = SQL_POST_MESSAGE;
  else sql = SQL_POST_MESSAGE.replace("group_id", "direct_chat_id");

  const { rows } = await pool.query(sql, [
    postMessage.chatId.id,
    user_id,
    postMessage.message,
  ]);
  if (rows[0])
    return new NewMessage({
      chatId: postMessage.chatId,
      message: new Message(rows[0]),
    });
  else return false;
}

//limit: number of most recent messages to retrieve. Default(-1) indicates to retrieve all.
async function getMessagesByChatId(chatId = new ChatId({}), limit = -1) {
  const SQL_GET_MESSAGES = `
    SELECT messages.id, messages.text, messages.created, users.id AS user_id, users.name
    FROM messages
    INNER JOIN users
    ON messages.user_id = users.id
    WHERE messages.group_id = $1
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT $2
  `;

  let sql;
  let inputs = [chatId.id, limit];

  if (chatId.isGroup) sql = SQL_GET_MESSAGES;
  else sql = SQL_GET_MESSAGES.replace("group_id", "direct_chat_id");

  /*If true, retrieve all messages.
    Replace sql limit parameter with string 'ALL' to select all messages.
    Also, remove limit from inputs array.
  */
  if (limit === -1) {
    sql = sql.replace("$2", "ALL");
    inputs = inputs.slice(0, 1);
  }

  const { rows } = await pool.query(sql, inputs);
  const messages = rows.map((row) => new Message(row)).reverse();
  return messages;
}

/*Returns chat, if direct chat exists and you have access.
  Else returns false.
*/
async function findDirectChat(chatId = new ChatId({}), user_id) {
  const SQL_FIND_DIRECT_CHAT = `
    SELECT agent1.direct_chat_id AS id, users.name, users.id AS user_id, agent1.time_shown
    FROM direct_chat_agents AS agent1
    
    INNER JOIN direct_chat_agents AS agent2
    ON agent1.direct_chat_id = agent2.direct_chat_id
    
    INNER JOIN users
    ON agent2.user_id = users.id
    
    WHERE agent1.direct_chat_id = $1
    AND agent1.user_id = $2
    AND agent2.user_id != $2
  `;

  try {
    const { rows } = await pool.query(SQL_FIND_DIRECT_CHAT, [
      chatId.id,
      user_id,
    ]);
    if (rows[0]) return new Direct(rows[0]);
    else return false;
  } catch {
    return false;
  }
}

export {
  registerUser,
  registerGuest,
  findUser,
  findUserById,
  getUsers,
  getFriendships,
  putUserActivity,
  addFriend,
  reverseFriendRequest,
  openDirectChat,
  showDirectChat,
  hideDirectChat,
  findDirectChatShown,
  getMemberships,
  getUserGroups,
  getGroups,
  findGroupById,
  getMembersByGroupId,
  postMembership,
  deleteGroupApplication,
  putMemberRequest,
  leaveGroup,
  kickMember,
  postMessage,
  getMessagesByChatId,
  findDirectChat,
};

//used only by dbControls.js
export {
  findFriendshipById,
  setFriendshipStateById,
  deleteFriendship,
  getGroupSummaries,
  getDirectSummaries,
  findDirectChatByUserId,
  deleteDirectChat,
};
