import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertHighScoreSchema } from "@shared/schema";
import gameRouter from "./api/game";
import historyRouter from "./api/history";
import analyticsRouter from "./api/analytics";
import creditsRouter from "./api/credits";
import pointsRouter from "./api/points";
import adminRouter from "./api/admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Admin API routes for API key management
  app.use("/api/admin", adminRouter);

  // Game API routes for external platform integration
  app.use("/api/game", gameRouter);

  // Analytics API routes
  app.use("/api/game/analytics", analyticsRouter);

  // Credits management API routes
  app.use("/api/game/credits", creditsRouter);

  // Points redemption API routes
  app.use("/api/game/points", pointsRouter);

  // Game history API routes
  app.use("/api/history", historyRouter);

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

  // Bonus points endpoints for standalone game
  app.post("/api/bonus-points", async (req, res) => {
    try {
      const { playerId, bonusPoints } = req.body;
      if (!playerId || bonusPoints === undefined) {
        return res.status(400).json({ error: "playerId and bonusPoints are required" });
      }

      const result = await storage.saveBonusPoints(playerId, bonusPoints);
      res.json({ success: true, playerId, bonusPoints: result.bonusPoints });
    } catch (error) {
      console.error("Error saving bonus points:", error);
      res.status(500).json({ error: "Failed to save bonus points" });
    }
  });

  app.get("/api/bonus-points/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const result = await storage.getBonusPoints(playerId);
      res.json({ playerId, bonusPoints: result.bonusPoints });
    } catch (error) {
      console.error("Error fetching bonus points:", error);
      res.status(500).json({ error: "Failed to fetch bonus points" });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time game feed
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/game-feed' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected to game feed');

    ws.on('close', () => {
      console.log('WebSocket client disconnected from game feed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Store WebSocket server in app.locals so API routes can access it
  app.locals.wss = wss;

  return httpServer;
}
