"use client";

import { api } from "~/trpc/react";

const csvify = (data: any[]) => {
  if (data.length === 0) {
    return "";
  }

  let rows = [];
  const headers = Object.keys(data[0]);
  rows.push(headers.join(","));
  for (const row of data) {
    rows.push(Object.values(row).join(","));
  }
  return rows.join("\n");
};

export const Report = () => {
  const [users, userQuery] = api.quiz.getPassingUsers.useSuspenseQuery();

  const blob = new Blob([csvify(users)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  return (
    <a href={url} download="quiz_results.txt">
      Download
    </a>
  );
};
