import { memo } from "react";
import PropTypes from "prop-types";

function LoadError({ name = "data", className = "" }) {
  const text = "Error when retrieving " + name;

  const classes = "load-fail-text " + className;

  return <p className={classes}>{text}</p>;
}

LoadError.propTypes = {
  name: PropTypes.string,
  className: PropTypes.string,
};

export default memo(LoadError);
