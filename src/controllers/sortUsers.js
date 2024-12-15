function sortUsers(users) {
  const sortedUsers = users.toSorted((a, b) => {
    if (a.name < b.name) return -1;
    else return 1;
  });

  return sortedUsers;
}

export default sortUsers;
