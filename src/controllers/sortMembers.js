const PERMISSION_TYPE = ["member", "admin", "owner"];

function sortMembers(members, userId) {
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
    (member) => member.user_id === userId,
  );
  const user = sortedMembers.splice(userIndex, 1)[0];
  sortedMembers.unshift(user);

  return sortedMembers;
}

export default sortMembers;
