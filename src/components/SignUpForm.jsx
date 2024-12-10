function SignUpForm() {
  return (
    <>
      <h1>Sign Up</h1>
      <form action="" method="POST">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" placeholder="name" type="text" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" />
        <button>Sign Up</button>
      </form>
    </>
  );
}

export default SignUpForm;
