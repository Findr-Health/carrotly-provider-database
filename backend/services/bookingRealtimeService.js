/**
 * WebSocket Handler for Real-time Booking Updates
 * Provides instant notifications to providers and patients
 */

const WebSocket = require('ws');

class BookingRealtimeService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/api/bookings/realtime'
    });
    
    // Store active connections by user ID
    this.connections = new Map();
    
    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    
    console.log('📡 WebSocket server initialized for real-time booking updates');
  }
  
  handleConnection(ws, req) {
    // Extract user ID from query params
    const params = new URLSearchParams(req.url.split('?')[1]);
    const userId = params.get('userId');
    const userType = params.get('type'); // 'provider' or 'patient'
    
    if (!userId) {
      ws.close(4001, 'User ID required');
      return;
    }
    
    // Store connection
    const connectionKey = `${userType}:${userId}`;
    this.connections.set(connectionKey, ws);
    
    console.log(`🔗 WebSocket connected: ${connectionKey}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Real-time booking updates active',
      timestamp: new Date().toISOString()
    }));
    
    // Handle disconnection
    ws.on('close', () => {
      this.connections.delete(connectionKey);
      console.log(`🔌 WebSocket disconnected: ${connectionKey}`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${connectionKey}:`, error);
      this.connections.delete(connectionKey);
    });
    
    // Handle incoming messages (heartbeat, etc)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ 
            type: 'pong', 
            timestamp: new Date().toISOString() 
          }));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });
  }
  
  /**
   * Broadcast new booking to provider
   */
  notifyNewBooking(providerId, booking) {
    this.sendToUser('provider', providerId, {
      type: 'booking.new',
      urgent: this.isUrgent(booking),
      data: booking
    });
  }
  
  /**
   * Notify booking confirmation to patient
   */
  notifyBookingConfirmed(patientId, booking) {
    this.sendToUser('patient', patientId, {
      type: 'booking.confirmed',
      data: booking
    });
  }
  
  /**
   * Notify booking declined to patient
   */
  notifyBookingDeclined(patientId, booking, reason) {
    this.sendToUser('patient', patientId, {
      type: 'booking.declined',
      reason: reason,
      data: booking
    });
  }
  
  /**
   * Notify reschedule proposal to patient
   */
  notifyRescheduleProposed(patientId, booking, proposedTimes) {
    this.sendToUser('patient', patientId, {
      type: 'booking.reschedule_proposed',
      proposedTimes: proposedTimes,
      data: booking
    });
  }
  
  /**
   * Notify booking expiring soon to provider
   */
  notifyBookingExpiring(providerId, booking, hoursRemaining) {
    this.sendToUser('provider', providerId, {
      type: 'booking.expiring_soon',
      hoursRemaining: hoursRemaining,
      data: booking
    });
  }
  
  /**
   * Notify booking cancelled to provider
   */
  notifyBookingCancelled(providerId, booking) {
    this.sendToUser('provider', providerId, {
      type: 'booking.cancelled',
      data: booking
    });
  }
  
  /**
   * Helper: Send message to specific user
   */
  sendToUser(userType, userId, message) {
    const connectionKey = `${userType}:${userId}`;
    const ws = this.connections.get(connectionKey);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`📤 Sent ${message.type} to ${connectionKey}`);
    } else {
      console.log(`⚠️  No active connection for ${connectionKey}`);
      // TODO: Fall back to push notification
    }
  }
  
  /**
   * Helper: Check if booking is urgent (< 6 hours until expiry)
   */
  isUrgent(booking) {
    const expiresAt = new Date(booking.confirmation?.expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
    
    return hoursUntilExpiry < 6 && hoursUntilExpiry > 0;
  }
  
  /**
   * Broadcast to all connected providers
   */
  broadcastToProviders(message) {
    this.connections.forEach((ws, key) => {
      if (key.startsWith('provider:') && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }
  
  /**
   * Get connection status
   */
  getConnectionStats() {
    const providers = Array.from(this.connections.keys())
      .filter(key => key.startsWith('provider:')).length;
    const patients = Array.from(this.connections.keys())
      .filter(key => key.startsWith('patient:')).length;
    
    return {
      total: this.connections.size,
      providers,
      patients
    };
  }
}

module.exports = BookingRealtimeService;
