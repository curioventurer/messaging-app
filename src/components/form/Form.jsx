import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { FormDetail } from "../../../js/chat-data.js";

const FOCUS_DELAY = 100;

function Form({ children, formDetail }) {
  const [output, setOutput] = useState(formDetail.outputInitial);
  const [isBlink, setIsBlink] = useState(false);

  const outputElement = useRef(null);

  /*Show output message and blink.
    Also change focus if target is defined.
  */
  function updateOutput({ message, focusTarget }) {
    setOutput("Error: " + message);
    blink(outputElement, setIsBlink);

    if (focusTarget) focusInput(focusTarget);
  }

  //Scroll output into view and attract attention to it with blink
  function blink() {
    outputElement.current.scrollIntoView({ behavior: "smooth", block: "end" });

    //set timeout to switch off, sync the timeout to the animation duration.
    if (!isBlink) {
      setIsBlink(true);
      setTimeout(() => setIsBlink(false), 500);
    }
  }

  /*Restore focus to form input, after submission failure.
    This is needed as disabling the form inputs during submission causes loss of focus.
    A delay to restoring focus is added as the inputs need to be re-enabled first.
  */
  function focusInput(focusTarget) {
    setTimeout(() => {
      //Don't scroll, keep the viewport on output element to show the error message.
      focusTarget.current.focus({ preventScroll: true });
    }, FOCUS_DELAY);
  }

  function submit(event) {
    event.preventDefault();

    if (formDetail.isSubmitting) return;

    const result = formDetail.validateInputs();
    if (result !== true) return updateOutput(result);

    formDetail.updateIsSubmitting(true);

    const timeout = setTimeout(() => {
      formDetail.updateIsSubmitting(false);
      updateOutput({
        message:
          "connection timeout.\nTry again in a moment, make sure your internet is connected.",
        focusTarget: formDetail.submitButton,
      });
    }, formDetail.timeoutDuration);

    setOutput("Pending: Waiting for server response...");

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const request = new Request(formDetail.path, {
      method: "POST",
      body: JSON.stringify(formDetail.data),
      headers,
    });

    fetch(request)
      .then((res) => {
        clearTimeout(timeout);
        return res.json();
      })
      .then(({ err, data, info }) => {
        return formDetail.handleSubmitRes(err, data, info, updateOutput);
      })
      .catch(() => {
        clearTimeout(timeout);
        updateOutput({
          message: "submission error.",
        });
      })
      .finally(() => {
        formDetail.updateIsSubmitting(false);
      });
  }

  return (
    <form onSubmit={submit}>
      {children}
      <output
        name={formDetail.outputName}
        htmlFor={formDetail.outputFor}
        ref={outputElement}
        className={"pre-wrap" + (isBlink ? " blink" : "")}
      >
        {output}
      </output>
    </form>
  );
}

Form.propTypes = {
  children: PropTypes.element.isRequired,
  formDetail: PropTypes.instanceOf(FormDetail).isRequired,
};

export default Form;
