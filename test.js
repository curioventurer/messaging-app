/* eslint-disable */

import { RequestStatus, Member } from "./js/chat-data.js";
import "dotenv/config";
import { getGroupSummaries } from "./server/db/queries.js";

const array = [
  {
    id: 2,
    user_id: 2,
    name: "obb",
    permission: "member",
    state: "accepted",
    modified: "2023-10-24T06:07:30.000Z",
  },
  {
    id: 3,
    user_id: 3,
    name: "zhill",
    permission: "admin",
    state: "accepted",
    modified: "2024-09-01T09:07:30.000Z",
  },
  {
    id: 30,
    user_id: 3,
    name: "hill",
    permission: "admin",
    state: "accepted",
    modified: "2024-09-01T09:07:30.000Z",
  },
  {
    id: 1,
    user_id: 1,
    name: "windseeker",
    permission: "owner",
    state: "accepted",
    modified: "2020-08-31T07:07:30.000Z",
  },
];

//const newArr = Member.sortApplications(array);
//console.log(newArr);
//palace: 6, owner: 3
getGroupSummaries(1).then((i) => {
  //console.log(i);
});
`
  SELECT DISTINCT ON (groups.id)
      
  groups.id, groups.name, memberships.modified AS mem_modified,

  messages.id AS msg_id, messages.text AS msg_text, messages.created AS msg_created, messages.user_id AS msg_user_id, users.name AS msg_name

  FROM groups

  INNER JOIN memberships
  ON groups.id = memberships.group_id

  LEFT JOIN messages
  ON groups.id = messages.group_id

  INNER JOIN users
  ON messages.user_id = users.id

  WHERE memberships.user_id = 1
  AND memberships.state = 'accepted'

  ORDER BY groups.id, messages.created DESC, messages.id DESC;
`;
