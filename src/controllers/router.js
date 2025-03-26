import { memoize } from "./memoize.js";
import { User } from "../../js/chat-data";

//Checks if session is expired.
function isSessionExpired() {
  const date = JSON.parse(localStorage.getItem("session-date"));

  //If not defined, invalid. Clear storage and return true. Requires another login.
  if (date === null) {
    localStorage.removeItem("user");
    return true;
  }

  /*If duration exceeds 29days(approaches cookie expiration of 30days), cookie might be expired.
    Clear storage and return true. Requires another login.
  */
  const duration = Date.now() - date;
  if (duration > 29 * 24 * 60 * 60e3) {
    localStorage.removeItem("user");
    localStorage.removeItem("session-date");
    return true;
  }

  //Session is still valid, return false
  return false;
}

const parseUser = memoize(function (string) {
  return new User(JSON.parse(string));
});

/*Fetch user from localStorage.
  If found, it means user is logged in, return user.
  Else, return false to indicate user is logged out.
  Also return false if session is expired and require login.
*/
export function getUser() {
  const userString = localStorage.getItem("user");
  if (userString === null) return false;

  if (isSessionExpired()) return false;

  return parseUser(userString);
}
