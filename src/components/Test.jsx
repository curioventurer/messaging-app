//test code - react component used for testing

/* eslint-disable */

import { useState, useEffect, memo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import useSearchState from "../hooks/useSearchState.jsx";
import Loading from "./sys/Loading.jsx";
import LoadFail from "./sys/LoadFail.jsx";

function Test() {
  const [i, setI] = useState(0);

  //const [searchParams, setSearchParams] = useSearchParams();
  const ref = useRef(setI);
  //console.log('obj', searchParams.toString())
  console.log("render");

  const [fruit, setFruit] = useSearchState({
    param: "fruit",
    type: "string",
    initialState: "peach",
  });
  //const [apple, setApple] = useSearchState({param: "apple", type: "bool"});
  //const [cart, setCart] = useSearchState({param: "cart", type: "array"});

  function showCart() {
    if (cart.length === 0) return "empty";
    else return cart.join(" | ");
  }

  function generateFruit() {
    const a = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
    const n = Math.floor(Math.random() * 100);

    return a + n;
  }

  function randomCart() {
    const n = Math.floor(Math.random() * 4);

    const array = [[], [5], [6, 2, 0], [3, 7, 7, 1]];

    return array[n];
  }

  const [poke, setPoke] = useState(false);

  useEffect(() => {
    if (poke)
      ref.current((prev) => {
        console.log("i", prev);
        return prev;
      });
  }, [poke]);

  return (
    <>
      <h1>Test</h1>
      <Link to="/test">1</Link>
      <output style={{ display: "block", margin: "20px" }}>
        fruit: {fruit}
        <br />
        I: {i}
      </output>
      <button
        onClick={() => {
          setPoke((prev) => !prev);
        }}
      >
        Poke {poke ? "off" : "on"}
      </button>
      <button
        onClick={function () {
          setSearchParams((prev) => {
            /*
            

            const n = Math.floor(Math.random()*100);
            console.log("a", prev.get("v"), n)
            obj.set("v", n)
*/
            const obj = new URLSearchParams(prev);
            return obj;
          });
        }}
      >
        click
      </button>
      <button
        onClick={function () {
          setI((prev) => prev + 1);
        }}
      >
        I
      </button>
      <button
        onClick={function () {
          setFruit(generateFruit());
        }}
      >
        fruit
      </button>
      <button
        onClick={function () {
          setApple((p) => !p);
        }}
      >
        bool(apple)
      </button>
      <button
        onClick={function () {
          setCart(randomCart());
        }}
      >
        cart
      </button>
      <Loading />
      <LoadFail />
    </>
  );
}

export default memo(Test);
