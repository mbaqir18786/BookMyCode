const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRouter = require('./routes/auth');
const farmsRouter = require('./routes/farms');
const sellersRouter = require('./routes/sellers');
const marketplaceRouter = require('./routes/marketplace');
const recommendationsRouter = require('./routes/recommendations');
const incidentsRouter = require('./routes/incidents');
const superadminRouter = require('./routes/superadmin');
const chatbotRouter = require('./routes/chatbot');
const channelsRouter = require('./routes/channels');
const notificationsRouter = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/farms', farmsRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/farms', recommendationsRouter); // Also mount under /api/farms for /api/farms/:id/recommendation
app.use('/api/incidents', incidentsRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/chat', chatbotRouter);
app.use('/api/v1', channelsRouter);
app.use('/api/notifications', notificationsRouter);

// Root Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Integrated Crop Residue Management Platform API Server running' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
