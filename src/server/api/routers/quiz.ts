import { TRPCError } from "@trpc/server";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { quizQuestions, quizzes, tags, users } from "~/server/db/schema";

const validQuizTagLabels = [
  "Glassware Sink",
  "Handwashing Sink",
  "Telephone",
  "Emergency Shower",
  "Emergency Eyewash",
  "Broken Glass Disposal",
  "Biohazard Waste",
];

export const quizRouter = createTRPCRouter({
  startQuiz: protectedProcedure.mutation(async ({ ctx }) => {
    // Do nothing if there is an unfinished quiz
    const currentQuiz = await ctx.db.query.quizzes.findFirst({
      where: and(
        eq(quizzes.userId, ctx.session.user.id),
        isNull(quizzes.completedAt),
      ),
    });

    if (currentQuiz) {
      return;
    }

    // Create a new quiz
    const newQuiz = (
      await ctx.db
        .insert(quizzes)
        .values({ userId: ctx.session.user.id })
        .returning()
    )[0]!;
    // Create 3 random quiz questions
    // Pick one to set as current
    const labelIndices = new Set<number>();
    while (labelIndices.size < 3) {
      labelIndices.add(Math.floor(Math.random() * validQuizTagLabels.length));
    }
    const indexIndices = new Set<number>();
    while (indexIndices.size < 3) {
      indexIndices.add(Math.floor(Math.random() * 3));
    }

    const questions = await ctx.db
      .insert(quizQuestions)
      .values(
        Array.from(labelIndices).map((i, j) => ({
          quizId: newQuiz.id,
          tagName: validQuizTagLabels[i]!,
          index: Array.from(indexIndices)[j]!,
        })),
      )
      .returning();
    questions.sort((a, b) => a.index - b.index);
    const firstQuestion = questions[0]!;
    await ctx.db
      .update(quizzes)
      .set({ currentQuestion: firstQuestion.id })
      .where(eq(quizzes.id, newQuiz.id));
  }),
  getQuiz: protectedProcedure.query(async ({ ctx }) => {
    const currentQuiz = await ctx.db.query.quizzes.findFirst({
      where: and(
        eq(quizzes.userId, ctx.session.user.id),
        isNull(quizzes.completedAt),
      ),
      with: {
        questions: {
          columns: { id: true, tagName: true },
        },
      },
    });

    if (currentQuiz) {
      const currentQuestion = currentQuiz.questions.find(
        (question) => question.id === currentQuiz.currentQuestion,
      );
      return { quizId: currentQuiz.id, question: currentQuestion! };
    } else {
      throw new TRPCError({ code: "NOT_FOUND", message: "no active quiz" });
    }
  }),
  submitQuestion: protectedProcedure
    .input(
      z.object({
        position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find the current quiz
      const currentQuiz = await ctx.db.query.quizzes.findFirst({
        where: and(
          eq(quizzes.userId, ctx.session.user.id),
          isNull(quizzes.completedAt),
        ),
        with: {
          questions: {
            columns: { id: true, tagName: true, index: true },
          },
        },
      });
      if (!currentQuiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "There is no active quiz",
        });
      }
      // Find the closest tag to the guess
      const currentQuestion = currentQuiz.questions.find(
        (question) => question.id === currentQuiz.currentQuestion,
      )!;
      const mattertags = await ctx.db.query.tags.findMany({
        where: eq(tags.label, currentQuestion.tagName),
      });
      const distances = mattertags.map((tag) => ({
        id: tag.id,
        dist: Math.sqrt(
          (tag.posX - input.position.x) ** 2 +
            (tag.posY + input.position.z) ** 2 +
            (tag.posZ - input.position.y) ** 2,
        ),
      }));
      distances.sort((a, b) => a.dist - b.dist);
      // Set current question's completion time and guessed coordinates
      await ctx.db
        .update(quizQuestions)
        .set({
          completedAt: new Date(),
          selectedX: input.position.x,
          selectedY: input.position.y,
          selectedZ: input.position.z,
          minDist: distances[0]!.dist,
          nearestTag: distances[0]!.id,
        })
        .where(eq(quizQuestions.id, currentQuiz.currentQuestion!));
      // Find a new question on this quiz that isn't completed and return it
      const newQuestion = await ctx.db.query.quizQuestions.findFirst({
        where: and(
          eq(quizQuestions.quizId, currentQuiz.id),
          eq(quizQuestions.index, currentQuestion.index + 1),
        ),
        columns: {
          id: true,
          tagName: true,
        },
      });

      if (!newQuestion) {
        // Quiz Completed, no next question
        await ctx.db
          .update(quizzes)
          .set({ completedAt: new Date() })
          .where(eq(quizzes.id, currentQuiz.id));
        return true;
      } else {
        await ctx.db
          .update(quizzes)
          .set({ currentQuestion: newQuestion.id })
          .where(eq(quizzes.id, currentQuiz.id));
        return false;
      }
    }),
  getScores: protectedProcedure.query(async ({ ctx }) => {
    const currentQuiz = await ctx.db.query.quizzes.findFirst({
      where: and(
        eq(quizzes.userId, ctx.session.user.id),
        isNull(quizzes.completedAt),
      ),
    });
    if (!currentQuiz) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "There is no active quiz",
      });
    }
    const questions = await ctx.db.query.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, currentQuiz.id),
      orderBy: [asc(quizQuestions.index)],
    });

    return questions.map((question) =>
      question.minDist ? question.minDist < 1 : null,
    );
  }),
  getScoresById: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { quizId } = input;
      const quiz = await ctx.db.query.quizzes.findFirst({
        where: and(eq(quizzes.id, quizId), isNotNull(quizzes.completedAt)),
      });
      if (!quiz) {
        // throw new TRPCError({
        //   code: "NOT_FOUND",
        //   message: "There is no completed quiz with this id",
        // });
        return false;
      }
      const questions = await ctx.db.query.quizQuestions.findMany({
        where: eq(quizQuestions.quizId, quiz.id),
        orderBy: [asc(quizQuestions.index)],
      });

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, quiz.userId),
        columns: {
          id: true,
          name: true,
        },
      });

      return {
        user: user!,
        scores: questions.map((question) => {
          return { tagName: question.tagName, correct: question.minDist! < 1 };
        }),
      };
    }),
  getAllScores: protectedProcedure.query(async ({ ctx }) => {
    const quizScores = await ctx.db.query.quizzes.findMany({
      with: {
        questions: {
          orderBy: [asc(quizQuestions.index)],
        },
      },
      orderBy: [asc(quizzes.completedAt)],
    });

    return quizScores.map((quiz) => ({
      quizId: quiz.id,
      completedAt: quiz.completedAt,
      questions: quiz.questions.map((question) => ({
        tagName: question.tagName,
        correct: question.minDist ? question.minDist < 1 : null,
      })),
    }));
  }),
  getPassingUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.email === null || ctx.session.user.email !== "drelliott@wpi.edu") {
      console.log(ctx.session.user);
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const users = await ctx.db.query.users.findMany({
      with: {
        quizzes: {
          columns: {
            completedAt: true,
          },
          with: {
            questions: {
              columns: {
                minDist: true,
              },
            },
          },
        },
      },
    });

    return users.map((user) => {
      return {
        name: user.name,
        email: user.email,
        completedQuiz: user.quizzes.some(
          (quiz) =>
            quiz.completedAt !== null &&
            quiz.questions.every((question) => question.minDist! < 1),
        ),
      };
    });
  }),
});
