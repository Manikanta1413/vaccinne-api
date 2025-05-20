import express from "express";
import dotenv from "dotenv";
import cluster from "cluster";
import os from "os";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import slotRoutes from "./routes/slot.routes";
import adminRoutes from "./routes/admin.routes";
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from IP"
});

dotenv.config();
const app = express();
const numCPUs = os.cpus().length;

app.use(express.json()); // for parsing application/json
app.use(limiter);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;

app.get("/", (_req, res) => {
  res.send("Vaccine Registration API is running...");
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with process id : ${process.pid}`);
  });
};

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer(); 
}

export default app;
