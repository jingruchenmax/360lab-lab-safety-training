export type DemoQuizState = {
  quizId: string;
  questionTags: string[];
  currentIndex: number;
  scores: Array<boolean | null>;
  answers: Array<{ tagName: string; correct: boolean | null }>;
  completed: boolean;
  completedAt?: string;
};

const QUIZ_TAGS = [
  "Glassware Sink",
  "Handwashing Sink",
  "Telephone",
  "Emergency Shower",
  "Emergency Eyewash",
  "Broken Glass Disposal",
  "Biohazard Waste",
];

const QUIZ_STATE_STORAGE_KEY = "lab-safety-demo-quiz-state";
const QUIZ_HISTORY_STORAGE_KEY = "lab-safety-demo-quiz-history";
const SEEN_TAGS_STORAGE_KEY = "lab-safety-demo-seen-tags";

const isClient = () => typeof window !== "undefined";

const shuffle = <T,>(values: T[]): T[] => {
  const copy = [...values];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }

  return copy;
};

const randomPassFail = () => Math.random() > 0.35;

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getQuizState = (): DemoQuizState | null => {
  if (!isClient()) {
    return null;
  }

  return parseJson<DemoQuizState>(
    window.localStorage.getItem(QUIZ_STATE_STORAGE_KEY),
  );
};

export const setQuizState = (state: DemoQuizState) => {
  if (!isClient()) {
    return;
  }

  window.localStorage.setItem(QUIZ_STATE_STORAGE_KEY, JSON.stringify(state));
};

const getQuizHistory = (): DemoQuizState[] => {
  if (!isClient()) {
    return [];
  }

  return (
    parseJson<DemoQuizState[]>(
      window.localStorage.getItem(QUIZ_HISTORY_STORAGE_KEY),
    ) ?? []
  );
};

const saveQuizHistory = (history: DemoQuizState[]) => {
  if (!isClient()) {
    return;
  }

  window.localStorage.setItem(QUIZ_HISTORY_STORAGE_KEY, JSON.stringify(history));
};

export const getCompletedQuizHistory = () => {
  return getQuizHistory().filter((quiz) => quiz.completed);
};

export const getSeenTagIds = (): string[] => {
  if (!isClient()) {
    return [];
  }

  return parseJson<string[]>(window.localStorage.getItem(SEEN_TAGS_STORAGE_KEY)) ?? [];
};

export const cacheSeenTag = (tagId: string): string[] => {
  const seenTags = getSeenTagIds();

  if (seenTags.includes(tagId)) {
    return seenTags;
  }

  const updatedSeenTags = [...seenTags, tagId];

  if (isClient()) {
    window.localStorage.setItem(
      SEEN_TAGS_STORAGE_KEY,
      JSON.stringify(updatedSeenTags),
    );
  }

  return updatedSeenTags;
};

export const startDemoQuiz = (questionCount = 3): DemoQuizState => {
  const selectedQuestions = shuffle(QUIZ_TAGS).slice(0, questionCount);

  const state: DemoQuizState = {
    quizId: `${Date.now()}`,
    questionTags: selectedQuestions,
    currentIndex: 0,
    scores: selectedQuestions.map(() => null),
    answers: selectedQuestions.map((tagName) => ({ tagName, correct: null })),
    completed: false,
  };

  setQuizState(state);
  return state;
};

export const getOrCreateQuizState = (): DemoQuizState => {
  const state = getQuizState();

  if (state && !state.completed) {
    return state;
  }

  return startDemoQuiz();
};

export const submitDemoAnswer = (isCorrect?: boolean): DemoQuizState => {
  const state = getOrCreateQuizState();
  const score = isCorrect ?? randomPassFail();
  const scores = [...state.scores];
  const answers =
    state.answers?.length === state.questionTags.length
      ? [...state.answers]
      : state.questionTags.map((tagName, index) => ({
          tagName,
          correct: state.scores[index] ?? null,
        }));

  scores[state.currentIndex] = score;
  answers[state.currentIndex] = {
    tagName: state.questionTags[state.currentIndex]!,
    correct: score,
  };

  const done = state.currentIndex >= state.questionTags.length - 1;
  const updatedState: DemoQuizState = {
    ...state,
    scores,
    answers,
    currentIndex: done ? state.currentIndex : state.currentIndex + 1,
    completed: done,
    completedAt: done ? new Date().toISOString() : undefined,
  };

  setQuizState(updatedState);

  if (done) {
    saveQuizHistory([...getQuizHistory(), updatedState]);
  }

  return updatedState;
};

export const resetDemoProgress = () => {
  if (!isClient()) {
    return;
  }

  window.localStorage.removeItem(QUIZ_STATE_STORAGE_KEY);
  window.localStorage.removeItem(QUIZ_HISTORY_STORAGE_KEY);
  window.localStorage.removeItem(SEEN_TAGS_STORAGE_KEY);
};
