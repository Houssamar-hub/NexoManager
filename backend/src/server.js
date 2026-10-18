
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to NexoManager API",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`NexoManager API running on port ${PORT}`);
});
