function sortChats(chats) {
  const sortedChats = chats.toSorted((a, b) => {
    //Use chat object itself for sorting if lastMessage is nullish, otherwise use lastMessage.
    const itemA = a.lastMessage ?? a;
    const itemB = b.lastMessage ?? b;

    /*Sort by new item first, using time.
      If joined time is defined, item is a group chat object and should use joined time,
      else if time_shown, it is a direct chat object
      else it is a lastMessage object and should use created time.
    */
    const timeA = new Date(
      itemA.joined ?? itemA.time_shown ?? itemA.created,
    ).getTime();
    const timeB = new Date(
      itemB.joined ?? itemB.time_shown ?? itemB.created,
    ).getTime();
    const timeDiff = timeB - timeA;

    return timeDiff;
  });

  return sortedChats;
}

export default sortChats;
