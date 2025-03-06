import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";

const FOCUS_DELAY = 100;
const TIMEOUT_DURATION = 5000;

function AuthForm({ children, formInfo }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const message = searchParams.get("msg");
  let initialOutput;

  if (message) initialOutput = "Result: " + message;
  else initialOutput = formInfo.initialOutput;

  const [output, setOutput] = useState(initialOutput);
  const [isBlink, setIsBlink] = useState(false);

  const outputElement = useRef(null);

  const navigate = useNavigate();

  //Msg search query is only used once when the page is loaded to tell the output to show result from the previous page before redirect. Thus, it is cleared from the url after loading to prevent showing the message twice.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const current = new URLSearchParams(prev);
        current.delete("msg");
        return current;
      },
      { replace: true },
    );
  }, [setSearchParams]);

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

    if (formInfo.submitting) return;

    const result = formInfo.validateInputs();
    if (result !== true) return updateOutput(result);

    formInfo.updateSubmitting(true);

    const timeout = setTimeout(() => {
      formInfo.updateSubmitting(false);
      updateOutput({
        message:
          "connection timeout.\nTry again in a moment, make sure your internet is connected.",
        focusTarget: formInfo.submitButton,
      });
    }, TIMEOUT_DURATION);

    setOutput("Pending: Waiting for server response...");

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    const request = new Request(formInfo.path, {
      method: "POST",
      body: JSON.stringify(formInfo.data),
      headers,
    });

    fetch(request)
      .then((res) => {
        clearTimeout(timeout);
        return res.json();
      })
      .then(({ err, user, info }) => {
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));

          return navigate(searchParams.get("rdr") ?? "/home", {
            replace: true,
          });
        }

        updateOutput(formInfo.parseSubmitRes(err, info));
        formInfo.updateSubmitting(false);
      })
      .catch(() => {});
  }

  return (
    <form onSubmit={submit}>
      {children}
      <output
        name={formInfo.outputName}
        htmlFor={formInfo.outputFor}
        ref={outputElement}
        className={"pre-wrap" + (isBlink ? " blink" : "")}
      >
        {output}
      </output>
    </form>
  );
}

AuthForm.propTypes = {
  children: PropTypes.element.isRequired,
  formInfo: PropTypes.object.isRequired,
};

export default AuthForm;
