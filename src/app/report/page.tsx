import { Report } from "../_components/report";
import { Suspense } from "react";

const ReportPage = async () => {
  return (
    <main>
      <Suspense fallback="Loading...">
        <Report />
      </Suspense>
    </main>
  );
};

export default ReportPage;
