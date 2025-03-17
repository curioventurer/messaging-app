/* eslint-disable */

import { RequestStatus, Member } from "./js/chat-data.js";
import "dotenv/config";
import { postMembership, memberRequestUpdate } from "./server/db/queries.js";

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
memberRequestUpdate(54, RequestStatus.ACCEPTED, 3).then((i) => {
  console.log(i);
});
