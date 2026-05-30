import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

// Increase JSON body parser limit to support base64 encrypted images and videos backup payloads
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Simple in-memory DB cache and persistent file-backup manager
interface UserModel {
  password?: string;
  vaultItems: any[];
  vaultPasscode: string;
  isPasscodeSetUp: boolean;
  history: any[];
}

interface DatabaseSchema {
  users: {
    [email: string]: UserModel;
  };
}

// Read database from file system
function readDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database file, starting fresh:", error);
  }
  return { users: {} };
}

// Write database changes
function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving database file:", error);
  }
}

// Initialize database with default template
const initialDb = readDatabase();
saveDatabase(initialDb);

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Admin credentials
const ADMIN_EMAILS = ["ab405127@gmail.com", "ab4051027@gmail.com"];
const ADMIN_PASSWORD = "famousankit@123";

// User Registration endpoint
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required parameters." });
  }

  const cleanedEmail = email.trim().toLowerCase();
  const db = readDatabase();

  if (db.users[cleanedEmail]) {
    return res.status(400).json({ error: "Account with this Gmail already exists. Please log in." });
  }

  // Create new user record
  db.users[cleanedEmail] = {
    password: password,
    vaultItems: [],
    vaultPasscode: "1234",
    isPasscodeSetUp: false,
    history: []
  };

  saveDatabase(db);
  console.log(`[AUTH] User registered: ${cleanedEmail}`);

  res.json({
    success: true,
    email: cleanedEmail,
    vaultItems: [],
    vaultPasscode: "1234",
    isPasscodeSetUp: false,
    history: []
  });
});

// User Login endpoint (including admin escalation support)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required parameters." });
  }

  const cleanedEmail = email.trim().toLowerCase();
  const db = readDatabase();

  // Admin Check First
  if (ADMIN_EMAILS.includes(cleanedEmail) && password === ADMIN_PASSWORD) {
    console.log(`[AUTH-ADMIN] Administrator logged in: ${cleanedEmail}`);
    // If admin is also a regular user, return their user files, otherwise standard template
    const userState = db.users[cleanedEmail] || {
      vaultItems: [],
      vaultPasscode: "1234",
      isPasscodeSetUp: false,
      history: []
    };
    return res.json({
      success: true,
      email: cleanedEmail,
      isAdmin: true,
      ...userState
    });
  }

  const user = db.users[cleanedEmail];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid Gmail or credentials. Please try again." });
  }

  console.log(`[AUTH] User logged in: ${cleanedEmail}`);
  res.json({
    success: true,
    email: cleanedEmail,
    isAdmin: false,
    vaultItems: user.vaultItems || [],
    vaultPasscode: user.vaultPasscode || "1234",
    isPasscodeSetUp: user.isPasscodeSetUp || false,
    history: user.history || []
  });
});

// User Sync checkpoint backup (retains media folder, formulas history, and lock digits)
app.post("/api/sync", (req, res) => {
  const { email, vaultItems, vaultPasscode, isPasscodeSetUp, history } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Authenticated user email is required to backup configuration state." });
  }

  const cleanedEmail = email.trim().toLowerCase();
  const db = readDatabase();

  if (!db.users[cleanedEmail]) {
    // Lazy initialize to guarantee graceful handling
    db.users[cleanedEmail] = {
      vaultItems: [],
      vaultPasscode: "1234",
      isPasscodeSetUp: false,
      history: []
    };
  }

  // Back up parameters securely
  if (vaultItems !== undefined) db.users[cleanedEmail].vaultItems = vaultItems;
  if (vaultPasscode !== undefined) db.users[cleanedEmail].vaultPasscode = vaultPasscode;
  if (isPasscodeSetUp !== undefined) db.users[cleanedEmail].isPasscodeSetUp = isPasscodeSetUp;
  if (history !== undefined) db.users[cleanedEmail].history = history;

  saveDatabase(db);
  console.log(`[SYNC] Multi-device backup successful for email: ${cleanedEmail} with ${vaultItems?.length || 0} secure files.`);
  res.json({ success: true });
});

// Start routing Express and integration server
async function run() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Development Mode: Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production Mode: Static asset pipelines compiled.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OmniCalc Full-Stack Server running at: http://localhost:${PORT}`);
  });
}

run();
