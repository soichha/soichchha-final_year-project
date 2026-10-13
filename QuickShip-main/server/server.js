const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./models');
const { dropDuplicateIndexes } = require('./utils/indexCleanup');

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in .env. Refusing to start with an insecure default.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Courier Management System API is running');
});

const authRoutes = require('./routes/auth');
const parcelRoutes = require('./routes/parcels');

app.use('/api/auth', authRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/delivery-prediction', require('./routes/deliveryPrediction'));
app.use('/api/activity-log', require('./routes/activityLog'));

dropDuplicateIndexes(db.sequelize).then(() => db.sequelize.sync({ alter: true })).then(() => {
  console.log('Database synced successfully');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to sync database:', err);
  process.exit(1);
});
