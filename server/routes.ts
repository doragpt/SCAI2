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
      if (!files || files.length < 5) {
        return res.status(400).json({ message: "写真が必要です（最低5枚：顔写真3枚、全身写真2枚）" });
      }

      // Convert the photos to base64 strings
      const photos = files.map(file => file.buffer.toString('base64'));

      // Parse and validate the form data
      const formData = {
        ...req.body,
        // Convert string numbers to actual numbers
        age: parseInt(req.body.age),
        guaranteeAmount: parseInt(req.body.guaranteeAmount),
        height: parseInt(req.body.height),
        weight: parseInt(req.body.weight),
        // Optional measurements
        bust: req.body.bust ? parseInt(req.body.bust) : undefined,
        waist: req.body.waist ? parseInt(req.body.waist) : undefined,
        hip: req.body.hip ? parseInt(req.body.hip) : undefined,
        // Add the photos
        photos,
        // Convert string boolean to actual boolean
        sameDay: req.body.sameDay === 'true',
        // Parse JSON string back to array
        serviceTypes: JSON.parse(req.body.serviceTypes),
      };

      const profileData = insertTalentProfileSchema.parse(formData);
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