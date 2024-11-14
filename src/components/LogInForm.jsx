function LogInForm() {
  return (
    <>
      <h1>Log In</h1>
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
        <button>Log In</button>
      </form>
    </>
  );
}

export default LogInForm;
