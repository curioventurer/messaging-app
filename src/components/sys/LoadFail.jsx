import { memo } from "react";
import PropTypes from "prop-types";

function LoadFail({ name = "", className = "" }) {
  let text = "Failed to load";
  if (name) text += " " + name;

  const classes = "load-fail-text " + className;

  return <p className={classes}>{text}</p>;
}

LoadFail.propTypes = {
  name: PropTypes.string,
  className: PropTypes.string,
};

export default memo(LoadFail);
