import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';

// Read Firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));

// Initialize Firebase for server-side simulation
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Manual Trigger for Simulation
  app.post("/api/simulate", async (req, res) => {
    try {
      const invertersSnapshot = await getDocs(collection(db, 'inverters'));
      const results = [];

      for (const inverterDoc of invertersSnapshot.docs) {
        const inverterId = inverterDoc.id;
        const telemetryData = {
          inverterId,
          activePower: Math.random() * 50, // 0-50 kW
          dailyYield: Math.random() * 300, // 0-300 kWh
          totalYield: 15000 + Math.random() * 1000,
          voltage: 380 + (Math.random() - 0.5) * 20,
          current: 10 + (Math.random() - 0.5) * 5,
          timestamp: new Date().toISOString()
        };

        await addDoc(collection(db, 'telemetry'), telemetryData);
        
        // Update inverter status
        await updateDoc(doc(db, 'inverters', inverterId), {
          status: 'online',
          lastSeen: new Date().toISOString()
        });

        results.push({ inverterId, success: true });
      }

      res.json({ success: true, simulated: results.length });
    } catch (error) {
      console.error("Simulation error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
