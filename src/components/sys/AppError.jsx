import { useSearchParams } from "react-router-dom";

function AppError() {
  const [searchParams] = useSearchParams();

  return (
    <div className="error-page p-has-margin">
      <h1>Application Error</h1>
      <p>Error with {searchParams.get("err")}.</p>
      <p>
        Please reload the application. Click <a href="/">intro</a> to reload and
        return to introduction page.
      </p>
    </div>
  );
}

export default AppError;
