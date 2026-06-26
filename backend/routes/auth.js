// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Import models
import User from './models/faculty.js';
import Admin from './models/admin.js';

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection
mongoose.connect(
  'mongodb+srv://Mihir1231:Mihirpatel1231@isro.neyp4h6.mongodb.net/?retryWrites=true&w=majority&appName=ISRO',
  { useNewUrlParser: true, useUnifiedTopology: true }
).then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ---------------------- ROUTES ----------------------

// User login route
app.post('/api/auth/user/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.password !== password)
      return res.status(401).json({ message: 'Incorrect password' });

    res.status(200).json({ message: 'User login successful' });
  } catch (err) {
    console.error("User login error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login route
app.post('/api/auth/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (admin.password !== password)
      return res.status(401).json({ message: 'Incorrect password' });

    res.status(200).json({ message: 'Admin login successful' });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------------------------------------

app.listen(5000, () => console.log('🚀 Server running on port 5000'));
