function SignUpForm() {
  return (
    <>
      <h1>Sign Up</h1>
      <form action="" method="POST">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          placeholder="username"
          type="text"
        />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" />
        <button>Sign Up</button>
      </form>
    </>
  );
}

export default SignUpForm;
