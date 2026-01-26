/**
 * Push Notification Service
 * Sends FCM notifications to mobile devices for booking updates
 */

const admin = require('firebase-admin');

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    // Skip if already initialized
    if (admin.apps.length > 0) {
      this.initialized = true;
      console.log('✅ Firebase Admin already initialized');
      return;
    }

    try {
      // Check if Firebase credentials are configured
      if (!process.env.FIREBASE_PROJECT_ID || 
          !process.env.FIREBASE_CLIENT_EMAIL || 
          !process.env.FIREBASE_PRIVATE_KEY) {
        console.warn('⚠️ Firebase credentials not configured - push notifications disabled');
        return;
      }

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });

      this.initialized = true;
      console.log('✅ Firebase Admin initialized for push notifications');
    } catch (error) {
      console.error('❌ Firebase Admin initialization error:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Send notification to a single device
   * @param {String} fcmToken - Device FCM token
   * @param {Object} notification - { title, body, data }
   * @returns {Promise<Object>} - { success, messageId?, error? }
   */
  async sendToDevice(fcmToken, notification) {
    if (!this.initialized) {
      console.warn('Push notifications not initialized - skipping');
      return { success: false, error: 'Service not initialized' };
    }

    if (!fcmToken) {
      return { success: false, error: 'No FCM token provided' };
    }

    try {
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'booking_updates',
            sound: 'default',
            priority: 'high'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      
      console.log(`✅ Push notification sent: ${notification.title}`);
      return { success: true, messageId: response };

    } catch (error) {
      console.error('❌ Push notification error:', error.code, error.message);
      
      // Handle invalid tokens
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        console.log('Invalid FCM token - should be removed from user record');
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking confirmed notification
   */
  async sendBookingConfirmed(user, booking, provider) {
    if (!user.fcmToken) return { success: false, error: 'No FCM token' };

    const appointmentDate = new Date(booking.dateTime?.requestedStart || booking.appointmentDate);
    const dateStr = appointmentDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    return this.sendToDevice(user.fcmToken, {
      title: '✅ Booking Confirmed',
      body: `Your appointment with ${provider.practiceName || 'provider'} on ${dateStr} is confirmed`,
      data: {
        type: 'booking_confirmed',
        bookingId: booking._id.toString(),
        providerId: provider._id.toString(),
        screen: 'BookingDetail'
      }
    });
  }

  /**
   * Send booking request pending notification
   */
  async sendBookingPending(user, booking, provider) {
    if (!user.fcmToken) return { success: false, error: 'No FCM token' };

    return this.sendToDevice(user.fcmToken, {
      title: '⏳ Booking Request Sent',
      body: `Your request for ${provider.practiceName || 'provider'} is pending approval. You'll hear back within 48 hours.`,
      data: {
        type: 'booking_pending',
        bookingId: booking._id.toString(),
        providerId: provider._id.toString(),
        screen: 'BookingDetail'
      }
    });
  }

  /**
   * Send suggested times received notification
   */
  async sendSuggestedTimesReceived(user, booking, provider) {
    if (!user.fcmToken) return { success: false, error: 'No FCM token' };

    const timesCount = booking.suggestedTimes?.length || 0;

    return this.sendToDevice(user.fcmToken, {
      title: '📅 Suggested Times Available',
      body: `${provider.practiceName || 'Provider'} suggested ${timesCount} available times. Tap to choose!`,
      data: {
        type: 'suggested_times',
        bookingId: booking._id.toString(),
        providerId: provider._id.toString(),
        screen: 'SuggestedTimes'
      }
    });
  }

  /**
   * Send booking cancelled notification
   */
  async sendBookingCancelled(user, booking, provider, reason) {
    if (!user.fcmToken) return { success: false, error: 'No FCM token' };

    return this.sendToDevice(user.fcmToken, {
      title: '❌ Booking Cancelled',
      body: reason || `Your booking with ${provider.practiceName || 'provider'} has been cancelled`,
      data: {
        type: 'booking_cancelled',
        bookingId: booking._id.toString(),
        providerId: provider._id.toString(),
        screen: 'Bookings'
      }
    });
  }

  /**
   * Send provider notification (for providers' mobile app)
   */
  async sendToProvider(provider, notification) {
    // If provider has an FCM token (when we build provider app)
    if (!provider.fcmToken) {
      console.log('Provider has no FCM token - notification skipped');
      return { success: false, error: 'No provider FCM token' };
    }

    return this.sendToDevice(provider.fcmToken, notification);
  }
}

// Export singleton instance
module.exports = new PushNotificationService();
