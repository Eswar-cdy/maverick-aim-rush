/**
 * k6 load test for WebSocket heart rate streaming
 * Tests real-time HR data aggregation and burst control
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const hrMessagesReceived = new Rate('hr_messages_received');
const connectionErrors = new Rate('connection_errors');
const messageErrors = new Rate('message_errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '2m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    hr_messages_received: ['rate>0.8'],  // 80% of messages should be received
    connection_errors: ['rate<0.1'],     // Less than 10% connection errors
    message_errors: ['rate<0.05'],       // Less than 5% message errors
  },
};

// Test data
const WS_URL = 'ws://localhost:8000/ws/workout/1/';
const TEST_DURATION = 60; // seconds per VU

export default function () {
  const params = {
    headers: {
      'Authorization': 'Bearer test-token', // Replace with actual token
    },
  };

  const res = ws.connect(WS_URL, params, function (socket) {
    let messageCount = 0;
    let startTime = Date.now();
    let lastServerSeq = 0;
    let duplicateMessages = 0;
    let outOfOrderMessages = 0;

    // Send heart rate data every 100ms (10Hz)
    const hrInterval = setInterval(() => {
      const now = Date.now();
      const heartRate = 120 + Math.floor(Math.random() * 60); // 120-180 BPM
      
      const message = {
        type: 'heart_rate',
        client_msg_id: `hr_${now}_${__VU}_${__ITER}`,
        heart_rate: {
          heart_rate: heartRate,
          timestamp: now / 1000.0
        }
      };

      socket.send(JSON.stringify(message));
    }, 100);

    // Handle incoming messages
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        messageCount++;

        // Check message type
        if (message.type === 'heart_rate_update') {
          hrMessagesReceived.add(1);

          // Check server sequence for ordering
          if (message.server_seq) {
            if (message.server_seq <= lastServerSeq) {
              duplicateMessages++;
            } else if (message.server_seq !== lastServerSeq + 1) {
              outOfOrderMessages++;
            }
            lastServerSeq = message.server_seq;
          }

          // Validate HR data structure
          if (message.heart_rate && typeof message.heart_rate.heart_rate === 'number') {
            check(message.heart_rate, {
              'HR value is valid': (hr) => hr.heart_rate >= 30 && hr.heart_rate <= 220,
              'HR has timestamp': (hr) => hr.timestamp !== undefined,
              'HR has samples count': (hr) => hr.samples_count !== undefined,
            });
          } else {
            messageErrors.add(1);
          }
        }

        // Check for set updates
        if (message.type === 'set_update') {
          check(message, {
            'Set update has server_seq': (msg) => msg.server_seq !== undefined,
            'Set update has set data': (msg) => msg.set !== undefined,
          });
        }

      } catch (error) {
        console.error('Error parsing message:', error);
        messageErrors.add(1);
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectionErrors.add(1);
    });

    // Handle connection close
    socket.on('close', () => {
      clearInterval(hrInterval);
      console.log(`Connection closed. Messages received: ${messageCount}`);
    });

    // Test duration
    sleep(TEST_DURATION);
    
    // Clean up
    clearInterval(hrInterval);
    socket.close();

    // Final checks
    check(messageCount, {
      'Received messages': (count) => count > 0,
      'No duplicate messages': () => duplicateMessages === 0,
      'No out-of-order messages': () => outOfOrderMessages === 0,
    });

  });

  // Check connection
  check(res, {
    'WebSocket connection successful': (r) => r && r.status === 101,
  });

  if (!res || res.status !== 101) {
    connectionErrors.add(1);
  }
}

// Setup function to authenticate and get session ID
export function setup() {
  // This would typically authenticate and return session info
  // For now, return mock data
  return {
    sessionId: 1,
    token: 'test-token'
  };
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
}
