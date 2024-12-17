function sortChats(chats) {
  const sortedChats = chats.toSorted((a, b) => {
    //Use chat object itself for sorting if lastMessage is null, otherwise use lastMessage.
    const itemA = a.lastMessage ?? a;
    const itemB = b.lastMessage ?? b;

    /*Sort by new item first, using time.
      If joined time is defined, item is a chat object and should use joined time,
      else it is lastMessage object and should use created time.
    */
    const timeA = new Date(itemA.joined ?? itemA.created).getTime();
    const timeB = new Date(itemB.joined ?? itemB.created).getTime();
    const timeDiff = timeB - timeA;

    if (timeDiff !== 0) return timeDiff;
  });

  return sortedChats;
}

export default sortChats;
