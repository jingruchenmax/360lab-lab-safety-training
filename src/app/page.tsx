import { Home } from "./_components/home-main";

const HomePage = async () => {
  const matterportModelId =
    process.env.MATTERPORT_MODEL_ID ??
    process.env.NEXT_PUBLIC_MATTERPORT_MODEL_ID ??
    "";
  const matterportSdkKey = process.env.MATTERPORT_API_TOKEN ?? "";

  return (
    <main>
      <Home
        matterportModelId={matterportModelId}
        matterportSdkKey={matterportSdkKey}
      />
    </main>
  );
};

export default HomePage;
