import type { MpSdk } from "@matterport/sdk";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { MpSdkContext } from "~/mp_sdk_context";
import { ProgressCircle } from "./progress-circle";
import { IoMdInformationCircleOutline } from "react-icons/io";
import {
  cacheSeenTag,
  getSeenTagIds,
  resetDemoProgress,
  startDemoQuiz,
} from "./demo-progress";

export const TagChecklist = () => {
  const mpSdk = useContext(MpSdkContext);

  const [seenTagIds, setSeenTagIds] = useState<string[]>([]);
  const [totalTags, setTotalTags] = useState(7);

  useEffect(() => {
    setSeenTagIds(getSeenTagIds());
  }, []);

  useEffect(() => {
    if (!mpSdk) {
      return;
    }

    const markSeen = (tagId: string | null | undefined) => {
      if (!tagId) {
        return;
      }

      setSeenTagIds(cacheSeenTag(tagId));
    };

    const openTagsSubscription = mpSdk.Tag.openTags.subscribe(
      (openTags: MpSdk.Tag.OpenTags) => {
        // Treat hover, select, and dock interactions as a "seen" event.
        markSeen(openTags.hovered);
        markSeen(openTags.docked);

        for (const selectedId of openTags.selected) {
          markSeen(selectedId);
        }
      },
    );

    const tagDataSubscription = mpSdk.Tag.data.subscribe({
      onCollectionUpdated: (collection) => {
        const tagCount = Object.keys(collection).length;
        setTotalTags(Math.max(tagCount, 1));
      },
    });

    return () => {
      openTagsSubscription.cancel();
      tagDataSubscription.cancel();
    };
  }, [mpSdk]);

  const router = useRouter();

  const seen = seenTagIds.length;
  const total = totalTags;
  const sdkReady = mpSdk !== null;
  const canMarkSeen = seen < total;

  return (
    <div className="pointer-events-none absolute top-0 left-0 m-4 text-slate-200">
      <div className="pointer-events-auto flex w-56 flex-col items-center gap-2 bg-green-700/75 p-3">
        <ProgressCircle
          size={60}
          strokeWidth={5}
          progress={seen / total}
        />
        <span className="self-center">Seen tags: {seen}</span>
        {!sdkReady ? (
          <span className="px-2 text-center text-xs text-yellow-200">
            Demo mode: SDK is disabled, use the button below to cache seen tags.
          </span>
        ) : null}
        {!sdkReady ? (
          <button
            className="w-full bg-slate-900/60 px-2 py-1 text-sm"
            disabled={!canMarkSeen}
            onClick={() => {
              const nextTagIndex = seen + 1;
              setSeenTagIds(cacheSeenTag(`manual-tag-${nextTagIndex}`));
            }}
          >
            {canMarkSeen ? "Mark Seen Tag" : "All Tags Marked"}
          </button>
        ) : null}
        <button
          onClick={() =>
            alert(
              'Explore the lab space, click on the tags, and read the information within them. Once you feel satisfied that you understand the content and locations of the tags, click "Done Learning / Start Quiz."\n\n(You are not required to see every tag to take the quiz)',
            )
          }
        >
          <IoMdInformationCircleOutline className="size-10" />
        </button>
        <button
          className="w-full bg-green-900/70 px-2 py-1"
          onClick={() => {
            startDemoQuiz();
            router.push("/quiz");
          }}
        >
          Done Learning / Start Quiz
        </button>
        <button
          className="w-full bg-red-900/40 px-2 py-1 text-red-200"
          onClick={() => {
            resetDemoProgress();
            window.location.href = "/";
          }}
        >
          Reset Demo
        </button>
      </div>
    </div>
  );
};
