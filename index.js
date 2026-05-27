import express from 'express';
import mysql from 'mysql2/promise';
import path from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.MYSQL_URL;

if (!connectionString) {
  console.error("❌ Error: MYSQL_URL environment variable is missing!");
  process.exit(1);
}

// Initialize production database connection
const db = await mysql.createConnection(connectionString);
console.log("🚀 Connected to MySQL database successfully.");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve index.html dynamically based on local or container path
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// ── API ROUTES ───────────────────────────────────────────────────────────────
app.get('/api/cards', async (req, res) => {
  const [cards] = await db.query('SELECT * FROM cards');
  res.json(cards);
});

app.post('/api/cards', async (req, res) => {
  const { name, thing } = req.body;
  if (!name || !thing) {
    return res.status(400).json({ error: 'name and thing are required' });
  }
  const [result] = await db.query('INSERT INTO cards (name, thing) VALUES (?, ?)', [name, thing]);
  res.status(201).json({ id: result.insertId, name, thing });
});

app.delete('/api/cards/:id', async (req, res) => {
  await db.query('DELETE FROM cards WHERE id = ?', [req.params.id]);
  res.json({ deleted: true });
});

// Express 5 Global Async Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
