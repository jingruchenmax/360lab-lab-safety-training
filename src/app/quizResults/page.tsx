import { QuizResults } from "../_components/quiz-results";
import Link from "next/link";

const QuizResultsPage = async () => {
  return (
    <main>
      <QuizResults />
      <div className="fixed top-0 left-0 p-2 bg-slate-300 rounded-md">
        <Link href="/">Home</Link>
      </div>
    </main>
  );
};

export default QuizResultsPage;
