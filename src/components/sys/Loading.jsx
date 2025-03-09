import { memo } from "react";
import PropTypes from "prop-types";

function Loading({ name = "", className = "" }) {
  let text = "Loading";
  if (name) text += " " + name;

  const classes = "loading-text loading-ellipsis " + className;

  return <p className={classes}>{text}</p>;
}

Loading.propTypes = {
  name: PropTypes.string,
  className: PropTypes.string,
};

export default memo(Loading);
