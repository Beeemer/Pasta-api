const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Конфигурация за връзка с Postgres (Neon)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // нужно за Neon
    },
    client_encoding: "UTF8",
});

// middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
    res.send("Pasta API is running 🍝");
});

// Тест дали базата работи
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ ok: true, now: result.rows[0].now });
    } catch (err) {
        console.error("DB TEST ERROR:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Записване на отговор
app.post("/api/responses", async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers) {
            return res.status(400).json({ error: "Missing answers" });
        }

        // записваме целия обект answers в JSONB колоната data
        await pool.query("INSERT INTO responses (data) VALUES ($1)", [answers]);

        res.status(201).json({ ok: true });
    } catch (err) {
        console.error("Error saving response:", err);
        res.status(500).json({ error: err.message }); // показваме истинското съобщение
    }
});

// Взимане на всички отговори
app.get("/api/responses", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, created_at, data FROM responses ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching responses:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
