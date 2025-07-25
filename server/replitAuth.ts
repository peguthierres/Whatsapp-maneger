
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || 'whatsapp-bot-manager-jwt-secret-2024';
const SESSION_SECRET = process.env.SESSION_SECRET || 'whatsapp-bot-manager-secret-key-2024';

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // Configure session middleware
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS in production
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Get user from database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          sub: user.id, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      // Set token in session
      (req.session as any).token = token;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };

      res.json({ 
        message: "Login successful", 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName) {
        return res.status(400).json({ message: "Email, password, and first name are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        firstName,
        lastName: lastName || '',
        passwordHash
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          sub: user.id, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }, 
        JWT_SECRET, 
        { expiresIn: '7d' }
      );

      // Set token in session
      (req.session as any).token = token;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };

      res.status(201).json({ 
        message: "Registration successful", 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const token = (req.session as any)?.token;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Add user info to request
    (req as any).user = {
      claims: {
        sub: decoded.sub,
        email: decoded.email,
        first_name: decoded.firstName,
        last_name: decoded.lastName
      }
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
