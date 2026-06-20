const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const connectDB = require('./config/db');
const routes = require('./routes');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/api', routes);

// Base route
app.get('/', (req, res) => {
  res.send('Text-to-Learn API is running...');
});

const PORT = process.env.PORT || 5001;

// Connect to Database and start server
const startServer = async () => {
  try {
    // Only attempt DB connection if URI is provided, otherwise start server without DB for now
    if (process.env.MONGO_URI) {
      await connectDB();
    } else {
      console.log('No MONGO_URI provided. Skipping DB connection.');
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Self-ping mechanism to prevent Render free tier from sleeping (every 14 mins)
      const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
      if (RENDER_EXTERNAL_URL) {
        setInterval(() => {
          fetch(RENDER_EXTERNAL_URL)
            .then(res => console.log(`[Keep-Alive] Pinged self successfully: ${res.status}`))
            .catch(err => console.error(`[Keep-Alive] Ping failed:`, err.message));
        }, 14 * 60 * 1000);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
