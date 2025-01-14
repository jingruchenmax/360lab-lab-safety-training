"use client";

import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";

export const QuizResults = () => {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("id");

  if (!quizId) {
    return (
      <div className="v-screen flex h-screen items-center justify-center">
        <div className="flex flex-col space-y-3 bg-slate-500 p-3">
          <p className="text-red-800">Invalid or unfinished quiz</p>
        </div>
      </div>
    );
  }

  const [res, _scoresQuery] = api.quiz.getScoresById.useSuspenseQuery({
    quizId,
  });

  if (res === false) {
    return (
      <div className="v-screen flex h-screen items-center justify-center">
        <div className="flex flex-col space-y-3 bg-slate-500 p-3">
          <p className="text-red-800">Invalid or unfinished quiz</p>
        </div>
      </div>
    );
  }

  const { user, scores } = res;

  return (
    <div className="v-screen flex h-screen items-center justify-center">
      <div className="flex flex-col space-y-3 bg-slate-500 p-3">
        <p>User: {user!.name}</p>
        <p>Results:</p>
        {scores?.map(({ tagName, correct }, i) => (
          <div className="ml-3 flex flex-row" key={i}>
            <p>{tagName}: </p>
            <div
              className={`flex rounded-full ${correct ? "bg-green-500" : "bg-red-500"} mx-2 h-5 w-5`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};
