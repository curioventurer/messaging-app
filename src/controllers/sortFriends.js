import { FRIEND_REQUEST_ORDER } from "./constants";

function sortFriends(friends) {
  const sortedFriends = friends.toSorted((a, b) => {
    const orderA = FRIEND_REQUEST_ORDER[a.state];
    const orderB = FRIEND_REQUEST_ORDER[b.state];
    const orderDiff = orderA - orderB;
    if (orderDiff !== 0) return orderDiff;

    const timeA = new Date(a.modified).getTime();
    const timeB = new Date(b.modified).getTime();
    const timeDiff = timeB - timeA;

    if (timeDiff !== 0) return timeDiff;
    else return b.id - a.id;
  });

  return sortedFriends;
}

export default sortFriends;
