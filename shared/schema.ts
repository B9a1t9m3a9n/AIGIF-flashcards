import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// User roles table
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
});

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
  displayName: text('display_name').notNull(),
  grade: text('grade'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User relations
export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
}));

// Flashcard sets
export const flashcardSets = pgTable('flashcard_sets', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  createdById: integer('created_by_id').references(() => users.id),
  isPreloaded: boolean('is_preloaded').default(false),
  wordCount: integer('word_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Flashcard set relations
export const flashcardSetsRelations = relations(flashcardSets, ({ one, many }) => ({
  creator: one(users, { fields: [flashcardSets.createdById], references: [users.id] }),
  flashcards: many(flashcards),
  assignments: many(setAssignments),
}));

// Flashcards
export const flashcards = pgTable('flashcards', {
  id: serial('id').primaryKey(),
  setId: integer('set_id').references(() => flashcardSets.id).notNull(),
  word: text('word').notNull(),
  pronunciation: text('pronunciation'),
  definition: text('definition'),
  gifUrl: text('gif_url'),
  audioUrl: text('audio_url'),
  exampleSentence: text('example_sentence'),
  syllables: jsonb('syllables').default([]),
  createdById: integer('created_by_id').references(() => users.id),
  aiGenerated: boolean('ai_generated').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Flashcard relations
export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  set: one(flashcardSets, { fields: [flashcards.setId], references: [flashcardSets.id] }),
  creator: one(users, { fields: [flashcards.createdById], references: [users.id] }),
  progress: many(userFlashcardProgress),
}));

// Set assignments (teacher assigns sets to students)
export const setAssignments = pgTable('set_assignments', {
  id: serial('id').primaryKey(),
  setId: integer('set_id').references(() => flashcardSets.id).notNull(),
  assignedById: integer('assigned_by_id').references(() => users.id).notNull(),
  assignedToId: integer('assigned_to_id').references(() => users.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

// Set assignment relations
export const setAssignmentsRelations = relations(setAssignments, ({ one }) => ({
  set: one(flashcardSets, { fields: [setAssignments.setId], references: [flashcardSets.id] }),
  assignedBy: one(users, { fields: [setAssignments.assignedById], references: [users.id] }),
  assignedTo: one(users, { fields: [setAssignments.assignedToId], references: [users.id] }),
}));

// User progress on flashcards
export const userFlashcardProgress = pgTable('user_flashcard_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  flashcardId: integer('flashcard_id').references(() => flashcards.id).notNull(),
  status: text('status').notNull().default('new'), // new, learning, mastered, difficult
  correctCount: integer('correct_count').default(0),
  incorrectCount: integer('incorrect_count').default(0),
  lastPracticed: timestamp('last_practiced'),
  pronunciationAccuracy: integer('pronunciation_accuracy'), // percentage 0-100
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User flashcard progress relations
export const userFlashcardProgressRelations = relations(userFlashcardProgress, ({ one }) => ({
  user: one(users, { fields: [userFlashcardProgress.userId], references: [users.id] }),
  flashcard: one(flashcards, { fields: [userFlashcardProgress.flashcardId], references: [flashcards.id] }),
}));

// User activities
export const userActivities = pgTable('user_activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  activityType: text('activity_type').notNull(), // completed_set, practice_session, quiz_completion, etc.
  description: text('description').notNull(),
  pointsEarned: integer('points_earned').default(0),
  accuracy: integer('accuracy'), // percentage 0-100 if applicable
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User activity relations
export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, { fields: [userActivities.userId], references: [users.id] }),
}));

// Usage settings
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Validation schemas
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  displayName: (schema) => schema.min(2, "Display name must be at least 2 characters"),
}).omit({ createdAt: true });

export const insertFlashcardSetSchema = createInsertSchema(flashcardSets, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
}).omit({ createdAt: true });

export const insertFlashcardSchema = createInsertSchema(flashcards, {
  word: (schema) => schema.min(1, "Word must not be empty"),
}).omit({ createdAt: true });

export const insertUserFlashcardProgressSchema = createInsertSchema(userFlashcardProgress, {
  status: (schema) => z.enum(['new', 'learning', 'mastered', 'difficult']),
}).omit({ updatedAt: true });

// Types
export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserRole = "admin" | "teacher" | "student";

export type FlashcardSet = typeof flashcardSets.$inferSelect;
export type InsertFlashcardSet = z.infer<typeof insertFlashcardSetSchema>;

export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;

export type UserFlashcardProgress = typeof userFlashcardProgress.$inferSelect;
export type InsertUserFlashcardProgress = z.infer<typeof insertUserFlashcardProgressSchema>;

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
