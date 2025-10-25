import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

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

export const highScores = pgTable("high_scores", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  blocksStacked: integer("blocks_stacked").notNull(),
  highestRow: integer("highest_row").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHighScoreSchema = createInsertSchema(highScores).pick({
  playerName: true,
  score: true,
  blocksStacked: true,
  highestRow: true,
});

export type InsertHighScore = z.infer<typeof insertHighScoreSchema>;
export type HighScore = typeof highScores.$inferSelect;

// API Keys for external platform integration
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  name: true,
  webhookUrl: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Game sessions for tracking individual games
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id),
  externalPlayerId: text("external_player_id"),
  playerName: text("player_name"),
  initialCredits: decimal("initial_credits", { precision: 10, scale: 2 }).notNull(),
  stake: text("stake").notNull(),
  score: integer("score"),
  prize: decimal("prize", { precision: 10, scale: 2 }),
  prizeType: text("prize_type"),
  blocksStacked: integer("blocks_stacked"),
  highestRow: integer("highest_row"),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  externalPlayerId: true,
  playerName: true,
  initialCredits: true,
  stake: true,
});

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
