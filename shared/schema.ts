import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// GIF generation schemas
export const gifs = pgTable("gifs", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  url: text("url").notNull(),
  fileUrl: text("file_url").notNull(),
  userId: integer("user_id").references(() => users.id),
  settings: jsonb("settings").$type<{
    type: "animated" | "still",
    quality: "basic" | "standard" | "high" | "professional" | "ultra",
    style?: "photorealistic" | "artistic" | "cinematic" | "anime" | "cartoon" | "abstract",
    duration?: "short" | "medium" | "long"
  }>().default({
    type: "animated",
    quality: "standard"
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gifsRelations = relations(gifs, ({ one }) => ({
  user: one(users, {
    fields: [gifs.userId],
    references: [users.id],
  }),
}));

export const insertGifSchema = createInsertSchema(gifs, {
  prompt: (schema) => schema.min(1, "Prompt is required").max(250, "Prompt cannot exceed 250 characters"),
});

export type InsertGif = z.infer<typeof insertGifSchema>;
export type Gif = typeof gifs.$inferSelect;

// Schema for validating the GIF generation request
export const generateGifSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(250, "Prompt cannot exceed 250 characters"),
  type: z.enum(["animated", "still"]).default("animated"),
  quality: z.enum(["basic", "standard", "high", "professional", "ultra"]).default("standard"),
  style: z.enum(["photorealistic", "artistic", "cinematic", "anime", "cartoon", "abstract"]).default("photorealistic"),
  duration: z.enum(["short", "medium", "long"]).default("medium"),
});

export type GenerateGifRequest = z.infer<typeof generateGifSchema>;

// Feedback and learning schemas
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  gifId: integer("gif_id").references(() => gifs.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  overallRating: integer("overall_rating").notNull(), // 1-5 scale
  objectQuality: integer("object_quality"), // 1-5 scale
  movementRealism: integer("movement_realism"), // 1-5 scale
  environmentAccuracy: integer("environment_accuracy"), // 1-5 scale
  lightingCoherence: integer("lighting_coherence"), // 1-5 scale
  textualFeedback: text("textual_feedback"),
  specificIssues: jsonb("specific_issues").$type<{
    morphing?: boolean,
    unnatural_motion?: boolean,
    wrong_environment?: boolean,
    lighting_issues?: boolean,
    object_distortion?: boolean,
    temporal_inconsistency?: boolean
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedbackRelations = relations(feedback, ({ one }) => ({
  gif: one(gifs, {
    fields: [feedback.gifId],
    references: [gifs.id],
  }),
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

// Bayesian learning statistics
export const learningStats = pgTable("learning_stats", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'object', 'movement', 'environment', 'lighting'
  heuristic: text("heuristic").notNull(), // specific technique or prompt component
  successCount: integer("success_count").default(0).notNull(),
  totalCount: integer("total_count").default(0).notNull(),
  averageRating: integer("average_rating").default(0).notNull(), // weighted average * 100
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  contextMetadata: jsonb("context_metadata").$type<{
    style?: string,
    quality?: string,
    common_prompts?: string[],
    effectiveness_trends?: Record<string, number>
  }>(),
});

export const insertFeedbackSchema = createInsertSchema(feedback, {
  overallRating: (schema) => schema.min(1).max(5),
  objectQuality: (schema) => schema.min(1).max(5).optional(),
  movementRealism: (schema) => schema.min(1).max(5).optional(),
  environmentAccuracy: (schema) => schema.min(1).max(5).optional(),
  lightingCoherence: (schema) => schema.min(1).max(5).optional(),
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type LearningStats = typeof learningStats.$inferSelect;
