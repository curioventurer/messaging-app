import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Form from "./Form.jsx";
import { allLinks } from "../../controllers/constant.js";
import { FormDetail, Group } from "../../../js/chat-data.js";

function CreateGroup() {
  const [name, setName] = useState("");
  const [is_public, set_is_public] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInput = useRef(null);
  const submitButton = useRef(null);

  const navigate = useNavigate();

  function updateIsSubmitting(bool) {
    setIsSubmitting(bool);
  }

  function updateName(event) {
    setName(event.target.value);
  }

  function updateIsPublic(event) {
    set_is_public(event.target.checked);
  }

  function parseOutput(err, info) {
    let message, focusTarget;

    if (err) message = "database error";
    else message = info.message;

    if (message === "name taken") focusTarget = nameInput;
    else focusTarget = nameInput;

    return {
      message,
      focusTarget,
    };
  }

  function handleSubmitRes(err, groupData, info, updateOutput) {
    if (groupData) {
      const group = new Group(groupData);
      navigate(`/group/${group.id}?info`);
    } else updateOutput(parseOutput(err, info));
  }

  const formDetail = new FormDetail({
    path: "/api/create-group",
    data: { name, is_public: is_public },
    outputName: "create group result",
    outputFor: "name",
    isSubmitting,
    submitButton,
    isSocket: true,
    handleSubmitRes,
    updateIsSubmitting,
  });

  return (
    <div className="form-page">
      <h1>Create Group</h1>
      <Form formDetail={formDetail}>
        <ul>
          <li>
            <label htmlFor="name">Name</label>
            <input
              ref={nameInput}
              type="text"
              name="name"
              id="name"
              aria-describedby="name-hint"
              maxLength="50"
              pattern={Group.nameRegex}
              value={name}
              onChange={updateName}
              autoComplete="off"
              disabled={isSubmitting}
              required
              autoFocus
            />
            <ul id="name-hint" className="form-hint marked-list">
              <li>1-50 word characters (a-z, A-Z, 0-9, _).</li>
            </ul>
          </li>
          <li className="checkbox">
            <label htmlFor="is_public">Public</label>
            <input
              type="checkbox"
              name="is_public"
              id="is_public"
              onChange={updateIsPublic}
              autoComplete="off"
              disabled={isSubmitting}
            />
          </li>
          <li>
            <button ref={submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Waiting..." : "Create"}
            </button>
          </li>
        </ul>
      </Form>
      <nav className="s-block-margin">
        <ul className="button-bar">
          <li>
            <Link
              to={allLinks.home.search.group.href}
              className={"button-link"}
            >
              Group Panel
            </Link>
          </li>
          <li>
            <Link to={allLinks.groupList.href} className={"button-link"}>
              {allLinks.groupList.name}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default CreateGroup;
