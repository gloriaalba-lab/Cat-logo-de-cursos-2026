
import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server in", process.env.NODE_ENV || "development", "mode");
  console.log("Current directory:", process.cwd());
  console.log("Files in current directory:", fs.readdirSync(process.cwd()));

  app.set('trust proxy', 1); // Required for secure cookies behind proxy
  app.use(express.json());
  app.use(cookieParser());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "cademmy-secret",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
      },
    })
  );

  // --- GOOGLE OAUTH ---
  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = `${process.env.APP_URL}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/drive.file",
      access_type: "offline",
      prompt: "consent",
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const redirectUri = `${process.env.APP_URL}/auth/google/callback`;
    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      (req.session as any).googleTokens = response.data;
      res.send(`
        <html><body><script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: 'google' }, '*');
            window.close();
          } else { window.location.href = '/'; }
        </script></body></html>
      `);
    } catch (error) {
      res.status(500).send("Google Auth Failed");
    }
  });

  // --- ONEDRIVE OAUTH ---
  app.get("/api/auth/onedrive/url", (req, res) => {
    const redirectUri = `${process.env.APP_URL}/auth/onedrive/callback`;
    const params = new URLSearchParams({
      client_id: process.env.ONEDRIVE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "Files.ReadWrite offline_access",
    });
    res.json({ url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}` });
  });

  app.get("/auth/onedrive/callback", async (req, res) => {
    const { code } = req.query;
    const redirectUri = `${process.env.APP_URL}/auth/onedrive/callback`;
    try {
      const response = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        new URLSearchParams({
          client_id: process.env.ONEDRIVE_CLIENT_ID!,
          client_secret: process.env.ONEDRIVE_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      (req.session as any).onedriveTokens = response.data;
      res.send(`
        <html><body><script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: 'onedrive' }, '*');
            window.close();
          } else { window.location.href = '/'; }
        </script></body></html>
      `);
    } catch (error) {
      res.status(500).send("OneDrive Auth Failed");
    }
  });

  // --- STATUS ENDPOINT ---
  app.get("/api/auth/status", (req, res) => {
    res.json({
      google: !!(req.session as any).googleTokens,
      onedrive: !!(req.session as any).onedriveTokens,
    });
  });

  // --- SAVE TO CLOUD (REAL INTEGRATION) ---
  app.post("/api/save-to-cloud", async (req, res) => {
    const { provider, courseData } = req.body;
    const fileName = `Curso_${courseData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    try {
      if (provider === 'google') {
        const tokens = (req.session as any).googleTokens;
        if (!tokens) return res.status(401).json({ success: false, message: "No conectado a Google Drive" });

        const metadata = {
          name: fileName,
          mimeType: 'application/json',
          parents: ['root']
        };

        const form = new URLSearchParams();
        const multipartBody = 
          `--foo\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
          `--foo\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(courseData)}\r\n` +
          `--foo--`;

        await axios.post(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          multipartBody,
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "Content-Type": "multipart/related; boundary=foo"
            }
          }
        );
      } else if (provider === 'onedrive') {
        const tokens = (req.session as any).onedriveTokens;
        if (!tokens) return res.status(401).json({ success: false, message: "No conectado a OneDrive" });

        await axios.put(
          `https://graph.microsoft.com/v1.0/me/drive/root:/Cademmy_Cursos/${fileName}:/content`,
          JSON.stringify(courseData),
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "Content-Type": "application/json"
            }
          }
        );
      }

      res.json({ success: true, message: `Curso guardado exitosamente en ${provider}` });
    } catch (error: any) {
      console.error(`Error saving to ${provider}:`, error.response?.data || error.message);
      res.status(500).json({ success: false, message: `Error al guardar en ${provider}` });
    }
  });

  // --- HUBSPOT CRM SYNC ---
  app.post("/api/crm/sync", async (req, res) => {
    const { email, firstName, lastName, photoUrl } = req.body;
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

    if (!accessToken) {
      console.warn("HUBSPOT_ACCESS_TOKEN not set, skipping CRM sync");
      return res.json({ success: true, message: "Sync skipped (no token)" });
    }

    try {
      // 1. Search for contact by email
      const searchResponse = await axios.post(
        "https://api.hubapi.com/crm/v3/objects/contacts/search",
        {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "email",
                  operator: "EQ",
                  value: email
                }
              ]
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (searchResponse.data.total > 0) {
        return res.json({ success: true, message: "Contact already exists in HubSpot" });
      }

      // 2. Create contact if not found
      await axios.post(
        "https://api.hubapi.com/crm/v3/objects/contacts",
        {
          properties: {
            email,
            firstname: firstName,
            lastname: lastName,
            lifecyclestage: "lead"
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      res.json({ success: true, message: "Contact added to HubSpot" });
    } catch (error: any) {
      console.error("HubSpot Sync Error:", error.response?.data || error.message);
      res.status(500).json({ success: false, message: "Error syncing with HubSpot" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        root: process.cwd(),
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware initialized");
      
      // Manual fallback for SPA in dev
      app.get("*all", async (req, res, next) => {
        const url = req.originalUrl;
        if (url.startsWith('/api') || url.startsWith('/auth')) return next();
        
        console.log(`Dev fallback for: ${url}`);
        try {
          let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (e) {
      console.error("Failed to initialize Vite middleware:", e);
    }
  } else {
    const distPath = path.join(__dirname, "dist");
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      console.log(`Prod fallback for: ${req.url}`);
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on 0.0.0.0:${PORT}`);
    console.log(`Access it at http://localhost:${PORT}`);
  });
}

startServer();
