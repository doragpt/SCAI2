import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { insertTalentProfileSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Public job listings route - no authentication required
  app.get("/api/jobs/public", async (req, res) => {
    const profiles = await storage.getStoreProfiles();
    res.json(profiles);
  });

  // Public job detail route - no authentication required
  app.get("/api/jobs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await storage.getStoreProfile(id);
    if (!profile) {
      return res.status(404).json({ message: "求人情報が見つかりませんでした" });
    }
    res.json(profile);
  });

  // Talent profile routes
  app.post("/api/talent/profile", upload.array("photos", 30), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (req.user.role !== "talent") return res.sendStatus(403);

      console.log('Files received:', req.files?.length);
      console.log('Form data:', req.body);

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length < 5) {
        return res.status(400).json({ message: "写真を最低でも5枚アップロードしてください" });
      }


      const formData = {
        ...req.body,
        age: parseInt(req.body.age),
        guaranteeAmount: parseInt(req.body.guaranteeAmount),
        height: parseInt(req.body.height),
        weight: parseInt(req.body.weight),
        bust: req.body.bust ? parseInt(req.body.bust) : undefined,
        waist: req.body.waist ? parseInt(req.body.waist) : undefined,
        hip: req.body.hip ? parseInt(req.body.hip) : undefined,
        photos: files.map(file => file.buffer.toString('base64')),
        sameDay: req.body.sameDay === 'true',
        serviceTypes: JSON.parse(req.body.serviceTypes || '[]'),
      };

      const profileData = insertTalentProfileSchema.parse(formData);
      const profile = await storage.createTalentProfile(req.user.id, profileData);
      res.json(profile);
    } catch (error) {
      console.error('Profile creation error:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "プロフィールの作成に失敗しました"
      });
    }
  });

  app.get("/api/talent/profiles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "store") return res.sendStatus(403);

    const profiles = await storage.getTalentProfiles();
    res.json(profiles);
  });

  // Application routes
  app.post("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const applicationData = insertApplicationSchema.parse(req.body);
    const application = await storage.createApplication(applicationData);
    res.json(application);
  });

  app.get("/api/applications/store", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "store") return res.sendStatus(403);

    const applications = await storage.getStoreApplications(req.user.id);
    res.json(applications);
  });

  // Protected store profile routes
  app.get("/api/store/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "store") return res.sendStatus(403);

    const applications = await storage.getStoreApplications(req.user.id);
    res.json(applications);
  });


  const httpServer = createServer(app);
  return httpServer;
}