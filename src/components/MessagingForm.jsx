import PropTypes from "prop-types";

function MessagingForm({ message, setMessage, submit }) {
  function handleInput(event) {
    setMessage(event.target.value);
  }

  return (
    <form className="messaging-form" onSubmit={submit}>
      <input
        type="text"
        name="message"
        id="messageInput"
        placeholder="Message"
        value={message}
        onChange={handleInput}
        autoFocus
      />
      <button>Send</button>
    </form>
  );
}

MessagingForm.propTypes = {
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
  submit: PropTypes.func.isRequired,
};

export default MessagingForm;
