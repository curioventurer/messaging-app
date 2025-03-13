import PropTypes from "prop-types";
import useTitle from "../../hooks/useTitle.jsx";

function Title({ children, title = "default" }) {
  useTitle(title);

  return children;
}

Title.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};

export default Title;
