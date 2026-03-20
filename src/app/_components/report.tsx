"use client";

import { useMemo } from "react";
import { getCompletedQuizHistory } from "./demo-progress";

const csvify = (data: object[]) => {
  if (data.length === 0) {
    return "";
  }

  const rows = [];
  const headers = Object.keys(data[0]!);
  rows.push(headers.join(","));
  for (const row of data) {
    rows.push(Object.values(row).join(","));
  }
  return rows.join("\n");
};

export const Report = () => {
  const users = useMemo(() => {
    const history = getCompletedQuizHistory();

    return history.map((quiz, index) => ({
      name: `Demo User ${index + 1}`,
      email: `demo${index + 1}@example.com`,
      completedQuiz: quiz.scores.every((score) => score === true),
    }));
  }, []);

  const blob = new Blob([csvify(users)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  return (
    <a href={url} download="quiz_results.txt">
      Download
    </a>
  );
};
