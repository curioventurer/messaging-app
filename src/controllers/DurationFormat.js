//date parameter allows any value accepted by Date().
class DurationFormat {
  static getDuration(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const MIN_IN_SECONDS = 60;
    const HOUR_IN_SECONDS = 3600;
    const DAY_IN_SECONDS = 86400;
    const MONTH_IN_SECONDS = 2592000; //assume 30 days a month
    const YEAR_IN_SECONDS = 31556952; //assume 365.2425 days a year

    let value, type;

    if (seconds < MIN_IN_SECONDS) {
      value = seconds;
      type = "second";
    } else if (seconds < HOUR_IN_SECONDS) {
      value = Math.floor(seconds / MIN_IN_SECONDS);
      type = "minute";
    } else if (seconds < DAY_IN_SECONDS) {
      value = Math.floor(seconds / HOUR_IN_SECONDS);
      type = "hour";
    } else if (seconds < MONTH_IN_SECONDS) {
      value = Math.floor(seconds / DAY_IN_SECONDS);
      type = "day";
    } else if (seconds < YEAR_IN_SECONDS) {
      value = Math.floor(seconds / MONTH_IN_SECONDS);
      type = "month";
    } else {
      value = Math.floor(seconds / YEAR_IN_SECONDS);
      type = "year";
    }

    const duration = { value, type };
    return duration;
  }

  static getString(date) {
    const duration = this.getDuration(date);
    const string =
      duration.value +
      " " +
      duration.type +
      (duration.value !== 1 ? "s" : "") +
      " ago";

    return string;
  }
}

export default DurationFormat;
