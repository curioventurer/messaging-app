import PropTypes from "prop-types";
import { Member } from "../controllers/chat-data";

function MemberItem({ member }) {
  return (
    <>
      <p>{member.name}</p>
      <p>{member.permission}</p>
    </>
  );
}

MemberItem.propTypes = {
  member: PropTypes.instanceOf(Member).isRequired,
};

export default MemberItem;
