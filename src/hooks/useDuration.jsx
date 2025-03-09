import { useEffect, useState } from "react";
import DurationFormat from "../controllers/DurationFormat.js";

/*Returns a duration string that update at delay intervals.
  time: any value accepted by Date().
  pause: stop interval.
*/
function useDuration(time, pause = false) {
  const DELAY = 5000;

  const [duration, setDuration] = useState("");

  useEffect(() => {
    function updateDuration() {
      setDuration(DurationFormat.getString(time));
    }

    //if time not defined, set default.
    if (!time) {
      setDuration("");
      return;
    }

    updateDuration();

    //no interval if paused.
    if (pause) return;

    const interval = setInterval(updateDuration, DELAY);

    return () => {
      clearInterval(interval);
    };
  }, [time, pause]);

  return duration;
}

export default useDuration;
