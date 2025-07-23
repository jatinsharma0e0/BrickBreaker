import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve the brick breaker game
  app.get("/game", (req, res) => {
    res.sendFile(path.join(process.cwd(), "client", "game.html"));
  });

  // Redirect root to game for convenience
  app.get("/", (req, res) => {
    res.redirect("/game");
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
