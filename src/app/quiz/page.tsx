import { QuizMain } from "../_components/quiz-main";

const QuizPage = async () => {
  const matterportModelId =
    process.env.MATTERPORT_MODEL_ID ??
    process.env.NEXT_PUBLIC_MATTERPORT_MODEL_ID ??
    "";
  const matterportSdkKey = process.env.MATTERPORT_API_TOKEN ?? "";

  return (
    <main>
      <QuizMain
        matterportModelId={matterportModelId}
        matterportSdkKey={matterportSdkKey}
      />
    </main>
  );
};

export default QuizPage;
