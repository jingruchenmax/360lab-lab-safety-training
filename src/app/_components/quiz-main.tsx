"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { Quiz } from "./quiz";

const MpSdkProvider = dynamic(
  () =>
    import("~/app/_components/mpsdk-provider").then((mod) => mod.MpSdkProvider),
  { ssr: false },
);

export const QuizMain = (props: {
  matterportModelId: string;
  matterportSdkKey?: string;
}) => {
  const { matterportModelId, matterportSdkKey } = props;
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(
    null,
  );

  return (
    <MpSdkProvider
      iframeElement={iframeElement}
      modelId={matterportModelId}
      sdkKey={matterportSdkKey}
    >
      <div className="relative h-[calc(var(--vh,1vh)*100)] w-[calc(var(--vw,1vw)*100)]">
        <Suspense fallback={<div>Loading...</div>}>
          <Quiz
            iframeWidth={iframeElement?.clientWidth}
            iframeHeight={iframeElement?.clientHeight}
          />
        </Suspense>
        <iframe
          ref={(el) => setIframeElement(el)}
          className="h-full w-full border-0"
          src={`https://my.matterport.com/show/?m=${matterportModelId}&brand=0&qs=1&views=0&hr=0&tagNav=0&search=0&vr=0&play=1&mt=0`}
        ></iframe>
      </div>
    </MpSdkProvider>
  );
};
