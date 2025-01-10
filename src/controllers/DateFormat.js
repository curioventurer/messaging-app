class DateFormat {
  static MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "Jun",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  static getMonthStr(monthIndex, short = false) {
    const month = this.MONTHS[monthIndex];

    if (short) return month.slice(0, 3);
    else return month;
  }

  /*Provide proper arguments based on Date(), returns only formatted time.
    Argument example: "2024-11-13T08:57:03.608Z", 1731488223608, dateObject
    Return example: "08:57"
  */
  static time(date) {
    const timestamp = new Date(date);
    return (
      timestamp.getHours() +
      ":" +
      timestamp.getMinutes().toString().padStart(2, "0")
    );
  }

  /*Provide proper arguments based on Date(), returns only formatted date.
    Argument example: "2024-11-13T08:57:03.608Z", 1731488223608, dateObject
    Return example: "Today", "13 November", "13 November 2024"
  */
  static date(date, short = false) {
    const clock = new Date();
    const timestamp = new Date(date);

    let displayDate = "";

    if (timestamp.toLocaleDateString() === clock.toLocaleDateString()) {
      //on the same day
      displayDate = "Today";
    } else if (timestamp.getFullYear() === clock.getFullYear()) {
      //on same year
      displayDate =
        timestamp.getDate() +
        " " +
        this.getMonthStr(timestamp.getMonth(), short);
    } else {
      //msg on different year
      displayDate =
        timestamp.getDate() +
        " " +
        this.getMonthStr(timestamp.getMonth(), short) +
        " " +
        timestamp.getFullYear();
    }

    return displayDate;
  }

  /*Provide proper arguments based on Date(), returns only formatted date or time.
    Argument example: "2024-11-13T08:57:03.608Z", 1731488223608, dateObject
    If argument date is today, return time. Return example: "08:57"
    If argument date is not today, return date. Return example: "13 November", "13 November 2024"
  */
  static timestamp(date, short = false) {
    const displayDate = this.date(date, short);

    if (displayDate === "Today") return this.time(date);
    else return displayDate;
  }
}

export default DateFormat;
