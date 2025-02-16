import { Link } from "react-router-dom";

function RouteError() {
  return (
    <div className="error-page">
      <h1>Routing Error</h1>
      <p>
        {"The url is invalid, go back to "}
        <Link to="/">Intro</Link>
        {"."}
      </p>
    </div>
  );
}

export default RouteError;
