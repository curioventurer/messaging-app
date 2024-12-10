function sortGroups(groups) {
  const sortedGroups = groups.toSorted((a, b) => {
    //Use group itself for sorting if lastMessage is null, otherwise use lastMessage.
    const itemA = a.lastMessage ?? a;
    const itemB = b.lastMessage ?? b;

    /*Sort by new item first, using time followed by id.
      If joined time is defined, item is a group and should use joined time,
      else it is lastMessage and should use created time.
    */
    const timeA = new Date(itemA.joined ?? itemA.created).getTime();
    const timeB = new Date(itemA.joined ?? itemB.created).getTime();
    const timeDiff = timeB - timeA;

    if (timeDiff !== 0) return timeDiff;
    else return itemB.id - itemA.id;
  });

  return sortedGroups;
}

export default sortGroups;
