function updateRect(setRect, element) {
  function rectIsEqual(rect1, rect2) {
    const keys = Object.keys(rect1.toJSON());
    return keys.every((key) => rect1[key] === rect2[key]);
  }

  setRect((prev) => {
    const current = element.getBoundingClientRect();

    //Return previous value if the object value is unchanged.
    if (rectIsEqual(prev, current)) return prev;
    else return current;
  });
}

export default updateRect;
