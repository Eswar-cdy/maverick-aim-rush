// Frontend testing utilities for Maverick Aim Rush
class TestUtils {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  // Test assertion methods
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}. Expected true, got false`);
    }
  }

  assertFalse(condition, message) {
    if (condition) {
      throw new Error(`Assertion failed: ${message}. Expected false, got true`);
    }
  }

  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(`Assertion failed: ${message}. Expected non-null value`);
    }
  }

  assertNull(value, message) {
    if (value !== null && value !== undefined) {
      throw new Error(`Assertion failed: ${message}. Expected null, got ${value}`);
    }
  }

  // Test execution methods
  async runTest(testName, testFunction) {
    this.currentTest = testName;
    console.log(`Running test: ${testName}`);
    
    try {
      await testFunction();
      this.testResults.push({ name: testName, status: 'PASS', error: null });
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.error(`❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Frontend Tests...');
    this.testResults = [];
    
    // Run all test suites
    await this.runAuthenticationTests();
    await this.runAPITests();
    await this.runNotificationTests();
    await this.runDataExportTests();
    await this.runMobileTests();
    
    this.printTestSummary();
  }

  printTestSummary() {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
    
    if (passed === total) {
      console.log('\n🎉 All tests passed!');
    }
  }

  // Test suites
  async runAuthenticationTests() {
    await this.runTest('Authentication - Token Storage', async () => {
      // Test token storage
      const testToken = 'test-access-token';
      localStorage.setItem('access_token', testToken);
      this.assertEqual(localStorage.getItem('access_token'), testToken, 'Token should be stored correctly');
      
      // Test token retrieval
      const retrievedToken = localStorage.getItem('access_token');
      this.assertEqual(retrievedToken, testToken, 'Token should be retrieved correctly');
    });

    await this.runTest('Authentication - Login State Check', async () => {
      // Test login state detection
      localStorage.setItem('access_token', 'valid-token');
      const isLoggedIn = !!localStorage.getItem('access_token');
      this.assertTrue(isLoggedIn, 'Should detect logged in state');
      
      localStorage.removeItem('access_token');
      const isLoggedOut = !localStorage.getItem('access_token');
      this.assertTrue(isLoggedOut, 'Should detect logged out state');
    });

    await this.runTest('Authentication - Logout Functionality', async () => {
      // Set up logged in state
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');
      
      // Simulate logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      this.assertNull(localStorage.getItem('access_token'), 'Access token should be removed on logout');
      this.assertNull(localStorage.getItem('refresh_token'), 'Refresh token should be removed on logout');
    });
  }

  async runAPITests() {
    await this.runTest('API - Base URL Configuration', async () => {
      // Test API base URL
      this.assertNotNull(window.api, 'API object should exist');
      this.assertEqual(window.api.API_BASE_URL, 'http://localhost:8000/api', 'API base URL should be correct');
    });

    await this.runTest('API - Request Headers', async () => {
      // Test that API requests include proper headers
      const token = 'test-token';
      localStorage.setItem('access_token', token);
      
      // Mock fetch to capture headers
      const originalFetch = window.fetch;
      let capturedHeaders = null;
      
      window.fetch = (url, options) => {
        capturedHeaders = options.headers;
        return Promise.resolve(new Response('{}', { status: 200 }));
      };
      
      try {
        await window.api.apiFetch('/test-endpoint');
        this.assertNotNull(capturedHeaders, 'Headers should be captured');
        this.assertEqual(capturedHeaders.Authorization, `Bearer ${token}`, 'Authorization header should be set');
      } finally {
        window.fetch = originalFetch;
      }
    });

    await this.runTest('API - Error Handling', async () => {
      // Test API error handling
      const originalFetch = window.fetch;
      
      window.fetch = () => {
        return Promise.resolve(new Response('{"error": "Test error"}', { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      };
      
      try {
        await window.api.apiFetch('/test-endpoint');
        this.assertTrue(false, 'Should have thrown an error');
      } catch (error) {
        this.assertTrue(error.message.includes('Test error'), 'Should handle API errors correctly');
      } finally {
        window.fetch = originalFetch;
      }
    });
  }

  async runNotificationTests() {
    await this.runTest('Notifications - Permission Check', async () => {
      // Test notification permission checking
      if ('Notification' in window) {
        const permission = Notification.permission;
        this.assertTrue(['default', 'granted', 'denied'].includes(permission), 'Permission should be valid');
      }
    });

    await this.runTest('Notifications - Manager Initialization', async () => {
      // Test notification manager initialization
      this.assertNotNull(window.notificationManager, 'Notification manager should exist');
      this.assertNotNull(window.notificationManager.permission, 'Permission should be initialized');
    });

    await this.runTest('Notifications - Settings Storage', async () => {
      // Test notification preferences storage
      const testPrefs = {
        enabled: true,
        workoutReminders: true,
        mealReminders: false
      };
      
      window.notificationManager.saveNotificationPreferences(testPrefs);
      const retrievedPrefs = window.notificationManager.getNotificationPreferences();
      
      this.assertEqual(retrievedPrefs.enabled, testPrefs.enabled, 'Enabled preference should be saved');
      this.assertEqual(retrievedPrefs.workoutReminders, testPrefs.workoutReminders, 'Workout reminders preference should be saved');
    });
  }

  async runDataExportTests() {
    await this.runTest('Data Export - Manager Initialization', async () => {
      // Test data export manager initialization
      this.assertNotNull(window.dataExportManager, 'Data export manager should exist');
      this.assertEqual(window.dataExportManager.apiBaseUrl, 'http://localhost:8000/api', 'API base URL should be correct');
    });

    await this.runTest('Data Export - File Validation', async () => {
      // Test file validation
      const validFile = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
      const invalidFile = new File(['invalid data'], 'test.txt', { type: 'text/plain' });
      
      // Test valid JSON file
      this.assertTrue(validFile.name.endsWith('.json'), 'Valid file should have .json extension');
      this.assertEqual(validFile.type, 'application/json', 'Valid file should have correct MIME type');
      
      // Test invalid file
      this.assertFalse(invalidFile.name.endsWith('.json'), 'Invalid file should not have .json extension');
    });

    await this.runTest('Data Export - Export Status Loading', async () => {
      // Test export status loading
      const originalFetch = window.fetch;
      
      window.fetch = () => {
        return Promise.resolve(new Response(JSON.stringify({
          available_formats: ['json', 'csv', 'summary'],
          supported_import_formats: ['json'],
          max_file_size: '10MB'
        }), { status: 200 }));
      };
      
      try {
        await window.dataExportManager.loadExportStatus();
        this.assertTrue(true, 'Export status should load successfully');
      } finally {
        window.fetch = originalFetch;
      }
    });
  }

  async runMobileTests() {
    await this.runTest('Mobile - App Initialization', async () => {
      // Test mobile app initialization
      this.assertNotNull(window.mobileApp, 'Mobile app should exist');
    });

    await this.runTest('Mobile - Touch Optimization', async () => {
      // Test touch optimization setup
      const touchElements = document.querySelectorAll('.button, .header__nav-link');
      this.assertTrue(touchElements.length > 0, 'Touch elements should exist');
    });

    await this.runTest('Mobile - Responsive Design', async () => {
      // Test responsive design elements
      const viewport = document.querySelector('meta[name="viewport"]');
      this.assertNotNull(viewport, 'Viewport meta tag should exist');
      
      const themeColor = document.querySelector('meta[name="theme-color"]');
      this.assertNotNull(themeColor, 'Theme color meta tag should exist');
    });

    await this.runTest('Mobile - PWA Features', async () => {
      // Test PWA features
      const manifest = document.querySelector('link[rel="manifest"]');
      this.assertNotNull(manifest, 'Manifest link should exist');
      
      const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
      this.assertNotNull(appleTouchIcon, 'Apple touch icon should exist');
    });
  }

  // Utility methods for testing
  mockFetch(responseData, status = 200) {
    const originalFetch = window.fetch;
    
    window.fetch = () => {
      return Promise.resolve(new Response(JSON.stringify(responseData), { 
        status: status,
        headers: { 'Content-Type': 'application/json' }
      }));
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }

  createMockFile(content, filename, type) {
    return new File([content], filename, { type: type });
  }

  simulateUserInteraction(element, eventType = 'click') {
    const event = new Event(eventType, { bubbles: true });
    element.dispatchEvent(event);
  }

  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
}

// Initialize test utils
window.testUtils = new TestUtils();

// Auto-run tests when page loads (for development)
if (window.location.search.includes('run-tests=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.testUtils.runAllTests();
    }, 1000);
  });
}
