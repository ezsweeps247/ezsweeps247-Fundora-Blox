import { users, type User, type InsertUser, highScores, type HighScore, type InsertHighScore, playerCredits } from "@shared/schema";
import { db } from "./db";
import { eq, sql as drizzleSql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveHighScore(highScore: InsertHighScore): Promise<HighScore>;
  getTopHighScores(limit: number): Promise<HighScore[]>;
  saveBonusPoints(playerId: string, bonusPoints: number): Promise<{ bonusPoints: number }>;
  getBonusPoints(playerId: string): Promise<{ bonusPoints: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private highScores: Map<number, HighScore>;
  currentUserId: number;
  currentHighScoreId: number;

  constructor() {
    this.users = new Map();
    this.highScores = new Map();
    this.currentUserId = 1;
    this.currentHighScoreId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveHighScore(insertHighScore: InsertHighScore): Promise<HighScore> {
    const id = this.currentHighScoreId++;
    const highScore: HighScore = {
      ...insertHighScore,
      id,
      createdAt: new Date(),
    };
    this.highScores.set(id, highScore);
    return highScore;
  }

  async getTopHighScores(limit: number): Promise<HighScore[]> {
    return Array.from(this.highScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async saveBonusPoints(playerId: string, bonusPoints: number): Promise<{ bonusPoints: number }> {
    // Use database for persistent storage
    try {
      // Try to insert or update
      const [result] = await db
        .insert(playerCredits)
        .values({
          apiKeyId: 1, // Default API key for standalone game
          externalPlayerId: playerId,
          bonusPoints: bonusPoints,
          balance: '0',
        })
        .onConflictDoUpdate({
          target: [playerCredits.apiKeyId, playerCredits.externalPlayerId],
          set: {
            bonusPoints: bonusPoints,
            updatedAt: new Date(),
          },
        })
        .returning();

      return { bonusPoints: result.bonusPoints };
    } catch (error) {
      console.error("Error saving bonus points to database:", error);
      return { bonusPoints: 0 };
    }
  }

  async getBonusPoints(playerId: string): Promise<{ bonusPoints: number }> {
    // Use database for persistent storage
    try {
      const [result] = await db
        .select()
        .from(playerCredits)
        .where(
          drizzleSql`${playerCredits.apiKeyId} = 1 AND ${playerCredits.externalPlayerId} = ${playerId}`
        )
        .limit(1);

      if (result) {
        return { bonusPoints: result.bonusPoints };
      }

      // Create default entry if doesn't exist
      const [newResult] = await db
        .insert(playerCredits)
        .values({
          apiKeyId: 1,
          externalPlayerId: playerId,
          bonusPoints: 0,
          balance: '0',
        })
        .returning();

      return { bonusPoints: newResult.bonusPoints };
    } catch (error) {
      console.error("Error getting bonus points from database:", error);
      return { bonusPoints: 0 };
    }
  }
}

export const storage = new MemStorage();
