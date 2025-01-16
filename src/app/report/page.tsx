import { headers } from "next/headers";
import { checkAuth } from "~/auth-helper";
import { Report } from "../_components/report";
import { Suspense } from "react";

const ReportPage = async () => {
  const headerList = headers();
  const pathname = headerList.get("x-current-path");
  await checkAuth(pathname);

  return (
    <main>
      <Suspense fallback="Loading...">
        <Report />
      </Suspense>
    </main>
  );
};

export default ReportPage;
