import PropTypes from "prop-types";

function MemberItem({ member }) {
  return (
    <>
      <p>{member.name}</p>
      <p>{member.permission}</p>
    </>
  );
}

MemberItem.propTypes = {
  member: PropTypes.object.isRequired,
};

export default MemberItem;
