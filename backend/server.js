require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const clarityAdminRoutes = require('./routes/clarityAdmin');
const feedbackRoutes = require('./routes/feedback');
const analyticsRoutes = require('./routes/analytics');
const adminManagementRoutes = require('./routes/adminManagement');
const eventsRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const reviewsAdminRoutes = require('./routes/reviewsAdmin');
const bookingsAdminRoutes = require('./routes/bookingsAdmin');
const bookingRoutes = require('./routes/bookings');
const searchRoutes = require('./routes/search');
const providerAdminRoutes = require('./routes/providerAdmin');
const inquiriesAdminRoutes = require('./routes/inquiriesAdmin');
const emailRoutes = require('./routes/email');
const cancellationRoutes = require('./routes/cancellation');
const serviceTemplatesRoutes = require('./routes/serviceTemplates');
const placesRoutes = require('./routes/places');
const availabilityRoutes = require('./routes/availability');
const paymentsRoutes = require('./routes/payments');
const providerServicesRoutes = require('./routes/providerServices');
const notificationRoutes = require('./routes/notifications');
const stripeConnectRoutes = require('./routes/stripeConnect');
const calendarRoutes = require('./routes/calendar');
const uploadRoutes = require('./routes/upload');
const { scheduleCronJobs } = require('./cron/bookingCron');

const app = express();

// Connect to MongoDB
connectDB();

// CORS Configuration - Allow all origins explicitly
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-provider-id', 'x-user-id', 'x-timezone'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', require('./routes/admin'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/clarity', require('./routes/clarity'));
app.use('/api/clarity-admin', clarityAdminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/clarity-admin/feedback', feedbackRoutes);
app.use('/api/admin/email', emailRoutes);
// Admin reviews & bookings management
app.use('/api/admin/reviews', reviewsAdminRoutes);
app.use('/api/admin/bookings', bookingsAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/inquiries', inquiriesAdminRoutes);

// User routes
app.use('/api/users', userRoutes);
app.use('/api/users', require('./routes/profileCompletion'));
app.use('/api/auth/google', require('./routes/google'));
// Availability routes
app.use('/api/availability', availabilityRoutes);

// Payments routes  
app.use('/api/payments', paymentsRoutes);
app.use('/api/connect', stripeConnectRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/providers', providerServicesRoutes);

// Review routes  
app.use('/api/reviews', reviewRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings', cancellationRoutes);  // ADD THIS LINE
app.use('/api/notifications', notificationRoutes);

// Search routes (enhanced with geo)
app.use('/api/search', searchRoutes);

// Admin provider management (verified badge, featured)
app.use('/api/admin/providers', providerAdminRoutes);

// Analytics & RBAC routes
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin', adminManagementRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/service-templates', serviceTemplatesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/places', placesRoutes);

// Health check with MongoDB status
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({ 
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

const PORT = process.env.PORT || 3001;
// Schedule booking cron jobs (reminders, expirations)
scheduleCronJobs();
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});