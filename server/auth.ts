import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { storage } from "./storage";
import { UserRole } from "@shared/schema";
import { log } from "./utils/logger";
import * as bcrypt from 'bcrypt';

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: UserRole;
      displayName: string;
      location: string;
      preferredLocations: string[];
      birthDate: string;
    }
  }
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    return await bcrypt.compare(supplied, stored);
  } catch (error) {
    log('error', 'Password comparison error', { error });
    return false;
  }
}

export function setupAuth(app: Express) {
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const role = req.body.role as UserRole;
        if (!role) {
          return done(null, false, { message: "ロールが指定されていません" });
        }

        const user = await storage.getUserByEmail(email);
        if (!user) {
          log('warn', 'User not found', { email });
          return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
        }

        if (user.role !== role) {
          log('warn', 'Invalid role', { email, expectedRole: role, actualRole: user.role });
          return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          log('warn', 'Invalid password', { email });
          return done(null, false, { message: "メールアドレスまたはパスワードが間違っています" });
        }

        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        log('error', 'Authentication error', { error, email });
        return done(error);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    log('debug', 'Serializing user', { userId: user.id });
    done(null, { id: user.id, role: user.role });
  });

  passport.deserializeUser(async (data: { id: number; role: UserRole }, done) => {
    try {
      const user = await storage.getUser(data.id);
      if (!user || user.role !== data.role) {
        log('warn', 'Session deserialization failed', { id: data.id, role: data.role });
        return done(null, false);
      }

      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      log('error', 'Session deserialization error', { error });
      done(error);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        log('error', 'Login error', { error: err });
        return next(err);
      }

      if (!user) {
        log('warn', 'Login failed', { 
          email: req.body.email,
          role: req.body.role,
          reason: info?.message 
        });
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }

      req.login(user, (err) => {
        if (err) {
          log('error', 'Session creation error', { error: err });
          return next(err);
        }

        log('info', 'Login complete', {
          userId: user.id,
          role: user.role,
          sessionId: req.sessionID
        });

        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    const userId = req.user?.id;
    const sessionId = req.sessionID;

    log('debug', 'Logout started', { userId, sessionId });

    req.logout((err) => {
      if (err) {
        log('error', 'Logout error', { error: err });
        return next(err);
      }

      req.session.destroy((err) => {
        if (err) {
          log('error', 'Session destruction error', { error: err });
          return next(err);
        }

        res.clearCookie('sessionId');
        log('info', 'Logout complete', { userId, sessionId });
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "認証されていません" });
    }
    res.json(req.user);
  });
}

export { comparePasswords };