"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getQuizState, resetDemoProgress, type DemoQuizState } from "./demo-progress";

export const QuizResults = () => {
  const router = useRouter();
  const [quizState, setQuizState] = useState<DemoQuizState | null>(null);

  useEffect(() => {
    setQuizState(getQuizState());
  }, []);

  if (!quizState?.completed) {
    return (
      <div className="v-screen flex h-screen items-center justify-center">
        <div className="flex flex-col space-y-3 bg-slate-500 p-3">
          <p className="text-red-800">Invalid or unfinished quiz</p>
        </div>
      </div>
    );
  }

  return (
    <div className="v-screen flex h-screen items-center justify-center">
      <div className="flex flex-col space-y-3 bg-slate-500 p-3">
        <p>User: Demo User</p>
        <p>Results:</p>
        {quizState.questionTags.map((tagName, i) => {
          const correct = quizState.scores[i] ?? false;

          return (
          <div className="ml-3 flex flex-row" key={i}>
            <p>{tagName}: </p>
            <div
              className={`flex rounded-full ${correct ? "bg-green-500" : "bg-red-500"} mx-2 h-5 w-5`}
            ></div>
          </div>
          );
        })}
        <button
          className="mt-2 bg-slate-200 px-2 py-1 text-slate-900"
          onClick={() => {
            resetDemoProgress();
            router.replace("/");
          }}
        >
          Reset Demo (Hard Refresh)
        </button>
      </div>
    </div>
  );
};
