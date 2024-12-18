import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTableCreator,
  primaryKey,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `360lab-webapp_${name}`);

// export const posts = createTable(
//   "post",
//   {
//     id: serial("id").primaryKey(),
//     name: varchar("name", { length: 256 }),
//     createdById: varchar("createdById", { length: 255 })
//       .notNull()
//       .references(() => users.id),
//     createdAt: timestamp("created_at", { withTimezone: true })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: timestamp("updatedAt", { withTimezone: true }),
//   },
//   (example) => ({
//     createdByIdIdx: index("createdById_idx").on(example.createdById),
//     nameIndex: index("name_idx").on(example.name),
//   })
// );

export const quizQuestions = createTable("quizQuestion", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tagName: varchar("tagName", { length: 255 }).notNull(),
  quizId: varchar("quizId", { length: 255 })
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  index: integer("index").notNull(),
  selectedX: real("selectedX"),
  selectedY: real("selectedY"),
  selectedZ: real("selectedZ"),
  minDist: real("minDist"),
  nearestTag: varchar("nearestTagId", { length: 255 }),
  completedAt: timestamp("completedAt", { withTimezone: true }),
});

export const quizQuestionRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  tag: one(tags, {
    fields: [quizQuestions.nearestTag],
    references: [tags.id],
  }),
}));

export const quizzes = createTable("quiz", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("userId", { length: 255 }).notNull(),
  currentQuestion: varchar("currentQuestion", { length: 255 }),
  startedAt: timestamp("startedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completedAt", { withTimezone: true }),
});

export const quizRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, { fields: [quizzes.userId], references: [users.id] }),
  questions: many(quizQuestions),
}));

export const tags = createTable("tag", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  label: text("label").notNull(),
  posX: real("posX").notNull(),
  posY: real("posY").notNull(),
  posZ: real("posZ").notNull(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  usersToTags: many(usersToTags),
}));

export const visits = createTable(
  "visits",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 }).notNull(),
    tagId: varchar("tagId", { length: 255 }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    fk: foreignKey({
      columns: [t.userId, t.tagId],
      foreignColumns: [usersToTags.userId, usersToTags.tagId],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  }),
);

export const visitsRelations = relations(visits, ({ one }) => ({
  usersToTags: one(usersToTags, {
    fields: [visits.userId, visits.tagId],
    references: [usersToTags.userId, usersToTags.tagId],
  }),
}));

export const usersToTags = createTable(
  "users_to_tags",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tagId: varchar("tagId", { length: 255 })
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.tagId] }),
  }),
);

export const usersToTagsRelations = relations(usersToTags, ({ one, many }) => ({
  user: one(users, {
    fields: [usersToTags.userId],
    references: [users.id],
  }),
  tag: one(tags, {
    fields: [usersToTags.tagId],
    references: [tags.id],
  }),
  visits: many(visits),
}));

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
  image: text("image"),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  usersToTags: many(usersToTags),
  quizzes: many(quizzes),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_userId_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
