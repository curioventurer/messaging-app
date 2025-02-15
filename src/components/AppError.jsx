import { useSearchParams } from "react-router-dom";

function AppError() {
  const [searchParams] = useSearchParams();

  return (
    <div className="error-page">
      <h1>Application Error</h1>
      <p>Error with {searchParams.get("error")}.</p>
      <p>
        Please reload the application. Click <a href="/">home</a> to reload and
        return to home.
      </p>
    </div>
  );
}

export default AppError;
