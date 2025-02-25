import { memo } from "react";
import PropTypes from "prop-types";

function Loading({ name }) {
  let text = "Loading";
  if (name) text += " " + name;

  return <p className="loading-text loading-ellipsis">{text}</p>;
}

Loading.propTypes = {
  name: PropTypes.string,
};

export default memo(Loading);
