import type { MpSdk } from "@matterport/sdk";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { MpSdkContext } from "~/mp_sdk_context";
import {
  getOrCreateQuizState,
  submitDemoAnswer,
  type DemoQuizState,
} from "./demo-progress";

type Point = {
  x: number;
  y: number;
  z: number;
};

const dist = (p1: Point, p2: Point) => {
  return Math.sqrt(
    (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2,
  );
};

export const Quiz = (props: {
  iframeWidth: number | undefined;
  iframeHeight: number | undefined;
}) => {
  const QUIZ_MATCH_RADIUS = 1;

  const router = useRouter();
  const [quizState, setQuizState] = useState<DemoQuizState | null>(null);
  const [tagData, setTagData] = useState<Record<string, MpSdk.Tag.TagData>>({});

  const mpSdk = useContext(MpSdkContext);

  const { iframeWidth, iframeHeight } = props;

  const [lastIntersectionTime, setLastIntersectionTime] = useState(
    new Date().getTime(),
  );
  const [lastIntersection, setLastIntersection] =
    useState<MpSdk.Pointer.Intersection>();
  const [lastPose, setLastPose] = useState<MpSdk.Camera.Pose>();
  const [buttonVisible, setButtonVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setQuizState(getOrCreateQuizState());
  }, []);

  useEffect(() => {
    if (!mpSdk) {
      // Fallback mode allows demos to proceed even without the Matterport SDK key.
      setButtonVisible(true);
      setButtonPosition({ top: 24, left: 24 });
    }
  }, [mpSdk]);

  useEffect(() => {
    if (mpSdk) {
      const pointerSubscription = mpSdk.Pointer.intersection.subscribe(
        (intersection: MpSdk.Pointer.Intersection) => {
          if (
            !buttonVisible ||
            (lastIntersection &&
              dist(lastIntersection.position, intersection.position) > 0.035)
          ) {
            setLastIntersectionTime(new Date().getTime());
            setButtonVisible(false);
          }
          setLastIntersection(intersection);
        },
      );

      const poseSubscription = mpSdk.Camera.pose.subscribe(
        (pose: MpSdk.Camera.Pose) => {
          setLastPose(pose);
        },
      );

      return () => {
        pointerSubscription.cancel();
        poseSubscription.cancel();
      };
    }
  }, [mpSdk, lastIntersection, buttonVisible]);

  useEffect(() => {
    if (!mpSdk) {
      return;
    }

    const hideAndDisableTag = async (id: string) => {
      try {
        await mpSdk.Tag.allowAction(id, {
          opening: false,
          navigating: false,
          docking: false,
          sharing: false,
        });
        await mpSdk.Tag.editOpacity(id, 0);
        await mpSdk.Tag.editStem(id, { stemVisible: false });
        await mpSdk.Tag.close(id);
      } catch (reason) {
        console.warn("[360lab] Failed to hide/disable tag:", reason);
      }
    };

    const subscription = mpSdk.Tag.data.subscribe({
      onAdded: (_index, item) => {
        setTagData((previous) => ({ ...previous, [item.id]: item }));
        void hideAndDisableTag(item.id);
      },
      onUpdated: (_index, item) => {
        setTagData((previous) => ({ ...previous, [item.id]: item }));
        void hideAndDisableTag(item.id);
      },
      onCollectionUpdated: (collection) => {
        const typedCollection = collection as Record<string, MpSdk.Tag.TagData>;
        setTagData(typedCollection);
        Object.keys(typedCollection).forEach((id) => {
          void hideAndDisableTag(id);
        });
      },
    });

    return () => {
      subscription.cancel();
    };
  }, [mpSdk]);

  useEffect(() => {
    if (mpSdk) {
      if (lastIntersection && lastPose && iframeWidth && iframeHeight) {
        const interval = setInterval(() => {
          if (new Date().getTime() > lastIntersectionTime + 750) {
            setButtonVisible(true);
            const coords = mpSdk.Conversion.worldToScreen(
              lastIntersection.position,
              lastPose,
              { w: iframeWidth, h: iframeHeight },
            );

            setButtonPosition({ top: coords.y - 45, left: coords.x - 35 });
          }
        }, 16);

        return () => clearInterval(interval);
      }
    }
  }, [
    mpSdk,
    iframeWidth,
    iframeHeight,
    lastIntersectionTime,
    lastIntersection,
    lastPose,
  ]);

  const normalizeLabel = (value: string) => value.trim().toLowerCase();

  const isCorrectSubmission = () => {
    if (!quizState || !lastIntersection) {
      return false;
    }

    const targetLabel = normalizeLabel(
      quizState.questionTags[quizState.currentIndex] ?? "",
    );

    const matchingTags = Object.values(tagData).filter(
      (tag) => normalizeLabel(tag.label) === targetLabel,
    );

    if (matchingTags.length === 0) {
      return false;
    }

    const nearestMatchingDistance = Math.min(
      ...matchingTags.map((tag) =>
        dist(lastIntersection.position, {
          x: tag.anchorPosition.x,
          y: tag.anchorPosition.y,
          z: tag.anchorPosition.z,
        }),
      ),
    );

    return nearestMatchingDistance <= QUIZ_MATCH_RADIUS;
  };

  const submitCurrentAnswer = () => {
    if (!quizState) {
      return;
    }

    const updated = submitDemoAnswer(isCorrectSubmission());

    if (updated.completed) {
      router.push("/quizResults");
      return;
    }

    setQuizState(updated);
  };

  return (
    <div className="pointer-events-none absolute h-screen w-screen">
      <div className="absolute right-0 h-screen">
        <div className="pointer-events-auto mr-8 flex w-40 flex-col items-center bg-green-600/60 py-1 text-slate-200">
          <div className="space-around mx-auto flex flex-row">
            {(quizState?.scores ?? []).map((score, i) => (
              <div
                key={i}
                className={`rounded-full ${score === null ? "bg-white" : score ? "bg-green-500" : "bg-red-500"} mx-2 h-5 w-5`}
              ></div>
            ))}
          </div>
          <p>Find: {quizState?.questionTags[quizState.currentIndex] ?? "Loading..."}</p>
          <button
            onClick={() =>
              alert(
                'Navigate to the referenced object, and then\n\nOn Desktop: Hover over the object until a "Submit" button appears, and click it.\n\nOn Mobile: Long press until the "Submit" button appears, then press it.\n\n(You must be within three feet of the object to get the question correct)',
              )
            }
          >
            <IoMdInformationCircleOutline className="size-10" />
          </button>
        </div>
      </div>
      <button
        className={`${buttonVisible ? "absolute block" : "hidden"} pointer-events-auto h-14 min-w-24 rounded-lg border border-emerald-900 bg-emerald-500/95 px-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200`}
        style={{ top: buttonPosition.top, left: buttonPosition.left }}
        onClick={() => {
          if (!quizState) {
            return;
          }

          setConfirmOpen(true);
        }}
      >
        Confirm
      </button>
      {confirmOpen ? (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl">
            <h2 className="text-base font-semibold">Submit Answer?</h2>
            <p className="mt-2 text-sm text-slate-700">
              This will lock in your current position for this question.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                onClick={() => {
                  setConfirmOpen(false);
                  submitCurrentAnswer();
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
