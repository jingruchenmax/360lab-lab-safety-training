import { headers } from "next/headers";
import { checkAuth } from "~/auth-helper";
import { Home } from "./_components/home-main";
import { getServerAuthSession } from "~/server/auth";

const HomePage = async () => {
  const headerList = headers();
  const pathname = headerList.get("x-current-path");
  await checkAuth(pathname);

  const session = await getServerAuthSession();

  return (
    <main>
      <Home />
    </main>
  );
};

export default HomePage;
