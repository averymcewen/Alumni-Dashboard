import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import alumniRoutes from "./routes/alumniRoutes.js";
import surveyRoutes from "./routes/surveyRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import mappingRoutes from "./routes/mappingRoutes.js";
import displayRoutes from "./routes/displayRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
});

app.use("/api/alumni", alumniRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/import", importRoutes);
app.use("/api/mappings", mappingRoutes);
app.use("/api/display", displayRoutes);

app.listen(PORT, "0.0.0.0", function () {
    console.log(`Server running on port ${PORT}`);
});
