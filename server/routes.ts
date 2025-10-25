import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHighScoreSchema } from "@shared/schema";
import gameRouter from "./api/game";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Game API routes for external platform integration
  app.use("/api/game", gameRouter);

  app.post("/api/scores", async (req, res) => {
    try {
      const validatedData = insertHighScoreSchema.parse(req.body);
      const highScore = await storage.saveHighScore(validatedData);
      res.json(highScore);
    } catch (error) {
      console.error("Error saving high score:", error);
      res.status(400).json({ error: "Invalid high score data" });
    }
  });

  app.get("/api/scores", async (req, res) => {
    try {
      const topScores = await storage.getTopHighScores(10);
      res.json(topScores);
    } catch (error) {
      console.error("Error fetching high scores:", error);
      res.status(500).json({ error: "Failed to fetch high scores" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
