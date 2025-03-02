import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { insertTalentProfileSchema, insertApplicationSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Talent profile routes
  app.post("/api/talent/profile", upload.array("photos", 30), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (req.user.role !== "talent") return res.sendStatus(403);

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "写真が必要です" });
      }

      const profileData = insertTalentProfileSchema.parse({
        ...req.body,
        photos: files.map(file => file.buffer.toString('base64'))
      });

      const profile = await storage.createTalentProfile(req.user.id, profileData);
      res.json(profile);
    } catch (error) {
      console.error('Profile creation error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "プロフィールの作成に失敗しました" });
    }
  });

  app.get("/api/talent/profiles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "scout") return res.sendStatus(403);

    const profiles = await storage.getTalentProfiles();
    res.json(profiles);
  });

  // Application routes
  app.post("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "scout") return res.sendStatus(403);

    const applicationData = insertApplicationSchema.parse(req.body);
    const application = await storage.createApplication(applicationData);
    res.json(application);
  });

  app.get("/api/applications/scout", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "scout") return res.sendStatus(403);

    const applications = await storage.getScoutApplications(req.user.id);
    res.json(applications);
  });

  const httpServer = createServer(app);
  return httpServer;
}