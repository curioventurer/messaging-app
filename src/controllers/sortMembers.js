import { Member } from "./chat-data";

const PERMISSION_TYPE = ["member", "admin", "owner"];

function sortMembers(members = [new Member({})], user_id = 0) {
  const sortedMembers = members.toSorted((a, b) => {
    const powerA = PERMISSION_TYPE.indexOf(a.permission);
    const powerB = PERMISSION_TYPE.indexOf(b.permission);
    const powerDiff = powerB - powerA;
    if (powerDiff !== 0) return powerDiff;

    if (a.name > b.name) return 1;
    else if (a.name < b.name) return -1;
    else return 0;
  });

  const userIndex = sortedMembers.findIndex(
    (member) => member.user_id === user_id,
  );
  if (userIndex !== -1) {
    const user = sortedMembers.splice(userIndex, 1)[0];
    sortedMembers.unshift(user);
  }

  return sortedMembers;
}

export default sortMembers;
