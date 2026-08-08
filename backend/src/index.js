import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { initSocket } from "./services/socket.service.js";
import connectDB from "./config/connectDB.js";
import { fileURLToPath } from 'url';
import path from "path";
// Import routes
import authRoutes from "./routes/auth.route.js";
import applicationRoutes from "./routes/application.route.js";
import candidateRoutes from "./routes/candidate.route.js";
import companyRoutes from "./routes/company.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import jobRoutes from "./routes/job.route.js";
import messageRoutes from "./routes/message.route.js";
import recommendedRoutes from "./routes/recommended.route.js";
import notificationRoutes from "./routes/notification.route.js";
import interviewRoutes from "./routes/interview.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- 1. INITIAL CONFIGURATION ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

// --- 5. SETUP HTTP SERVER & SOCKET.IO ---
const server = http.createServer(app);
initSocket(server); // Khởi tạo và gắn Socket.IO vào server


// --- 2. DATABASE CONNECTION ---
connectDB(); // Gọi hàm kết nối DB

// --- 3. MIDDLEWARES ---
const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "http://136.111.40.188",
    "http://localhost:3000",
    "http://localhost:4173",
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
})); 
app.use(express.json()); // for parsing application/json
app.use('/file_uploads', express.static(path.join(__dirname, '..', 'file_uploads')));// Serve static files from the 'uploads' directory
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// --- 4. API ROUTES ---
app.get("/", (req, res) => {
    res.send("API is running...");
});

app.use("/auth", authRoutes);   
app.use("/applications", applicationRoutes);
app.use("/candidates", candidateRoutes);
app.use("/companies", companyRoutes);
app.use("/conversations", conversationRoutes);
app.use("/jobs", jobRoutes);
app.use("/messages", messageRoutes);
app.use("/recommended", recommendedRoutes);
app.use("/notifications", notificationRoutes);
app.use("/interview", interviewRoutes);

// --- 6. START SERVER ---
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//module.exports = app;
