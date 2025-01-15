import { UserActivity, FriendRequest } from "./chat-data.js";

//compare by asc friend_request order (state prop).
function compare_state(a, b) {
  const orderA = FriendRequest.getOrder(a.state);
  const orderB = FriendRequest.getOrder(b.state);
  const state_diff = orderA - orderB;

  return state_diff;
}

//compare by desc modified time.
function compare_time(a, b) {
  const timeA = new Date(a.modified).getTime();
  const timeB = new Date(b.modified).getTime();
  const time_diff = timeB - timeA;

  return time_diff;
}

//compare by desc id.
function compare_id(a, b) {
  const id_diff = b.id - a.id;
  return id_diff;
}

//compare by desc modified time, then desc id.
function compare_time_id(a, b) {
  const time_diff = compare_time(a, b);
  if (time_diff !== 0) return time_diff;
  else return compare_id(a, b);
}

//compare by asc name.
function compare_name(a, b) {
  if (a.name < b.name) return -1;
  else if (a.name > b.name) return 1;
  else return 0;
}

//compare by offline last, all other activity is equal.
function compare_activity(a, b) {
  const a_is_offline = a.activity === UserActivity.OFFLINE;
  const b_is_offline = b.activity === UserActivity.OFFLINE;

  if (a_is_offline && !b_is_offline) return 1;
  else if (!a_is_offline && b_is_offline) return -1;
  else return 0;
}

//compare by activity, then asc name.
function compare_activity_name(a, b) {
  const activity_diff = compare_activity(a, b);
  if (activity_diff !== 0) return activity_diff;
  else return compare_name(a, b);
}

/*Sort array of friendship records.
  friends: contain instances of UserFriendship - chat-data.js
*/
function sortFriends(friends = []) {
  const sortedFriends = friends.toSorted((a, b) => {
    const state_diff = compare_state(a, b);
    if (state_diff !== 0) return state_diff;

    //compare friends differently compared to other types of friendship record.
    if (a.state === FriendRequest.ACCEPTED) return compare_activity_name(a, b);
    else return compare_time_id(a, b);
  });

  return sortedFriends;
}

export default sortFriends;
