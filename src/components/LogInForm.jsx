function LogInForm() {
  return (
    <>
      <h1>Log In</h1>
      <form action="" method="POST">
        <label htmlFor="name">Name</label>
        <input id="name" name="username" placeholder="name" type="text" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" />
        <button>Log In</button>
      </form>
    </>
  );
}

export default LogInForm;
