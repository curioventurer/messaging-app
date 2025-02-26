//test code - react component used for testing

import { useState, memo } from "react";
import Loading from "./Loading";
import LoadFail from "./LoadFail";

function Test() {
  const [i, setI] = useState(0);
  const [t, setT] = useState(false);
  console.log(i, t);

  return (
    <>
      <h1>Test</h1>
      <output style={{ display: "block", margin: "20px" }}>i: {i}</output>
      <button
        onClick={function () {
          setI((prev) => prev + 1);
        }}
      >
        click
      </button>
      <button onClick={() => setT(false)}>False</button>
      <button onClick={() => setT(true)}>True</button>
      <Loading />
      <LoadFail />
    </>
  );
}

export default memo(Test);
