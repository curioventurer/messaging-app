import { memo } from "react";
import PropTypes from "prop-types";

function LoadFail({ name }) {
  let text = "Failed to load";
  if (name) text += " " + name;

  return <p className="load-fail-text">{text}</p>;
}

LoadFail.propTypes = {
  name: PropTypes.string,
};

export default memo(LoadFail);
