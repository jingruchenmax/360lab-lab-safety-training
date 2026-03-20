"use client";

import { useEffect, useRef, useState } from "react";
import { type MpSdk, setupSdk } from "@matterport/sdk";
import { MpSdkContext } from "~/mp_sdk_context";

export const MpSdkProvider = (props: {
  iframeElement: HTMLIFrameElement | null;
  sdkKey?: string;
  modelId?: string;
  children: React.ReactNode;
}) => {
  const { iframeElement, sdkKey, modelId, children } = props;
  const [mpSdk, setMpSdk] = useState<MpSdk | null>(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (!ranOnce.current && iframeElement) {
      if (!sdkKey || !modelId) {
        console.warn(
          "[360lab] MATTERPORT_SDK_KEY or model ID missing; running in demo fallback mode.",
        );
        return;
      }

      ranOnce.current = true;

      setupSdk(sdkKey, {
        iframe: iframeElement,
        space: modelId,
      })
        .then((sdk) => {
          setMpSdk(sdk as MpSdk);
          console.info("[360lab] Matterport SDK successfully loaded");
        })
        .catch((reason) =>
          console.error(`Matterport SDK initialization failed: ${reason}`),
        );
    }
  }, [iframeElement, modelId, sdkKey]);

  return (
    <MpSdkContext.Provider value={mpSdk}>{children}</MpSdkContext.Provider>
  );
};
