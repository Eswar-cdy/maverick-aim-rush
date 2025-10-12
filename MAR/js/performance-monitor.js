// Performance monitoring for Maverick Aim Rush
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      apiCalls: [],
      userInteractions: [],
      errors: [],
      memoryUsage: [],
      networkRequests: []
    };
    
    this.thresholds = {
      pageLoadTime: 3000, // 3 seconds
      apiResponseTime: 2000, // 2 seconds
      memoryUsage: 50 * 1024 * 1024, // 50MB
      errorRate: 0.05 // 5%
    };
    
    this.init();
  }

  init() {
    this.monitorPageLoad();
    this.monitorAPICalls();
    this.monitorUserInteractions();
    this.monitorErrors();
    this.monitorMemoryUsage();
    this.monitorNetworkRequests();
    this.setupReporting();
  }

  monitorPageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      this.metrics.pageLoad = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint(),
        largestContentfulPaint: this.getLargestContentfulPaint(),
        cumulativeLayoutShift: this.getCumulativeLayoutShift()
      };
      
      this.checkPageLoadPerformance();
    });
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }

  getLargestContentfulPaint() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Resolve with null if no LCP after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  getCumulativeLayoutShift() {
    return new Promise((resolve) => {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        resolve(clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      
      // Resolve with current value after 5 seconds
      setTimeout(() => resolve(clsValue), 5000);
    });
  }

  checkPageLoadPerformance() {
    const { totalTime } = this.metrics.pageLoad;
    
    if (totalTime > this.thresholds.pageLoadTime) {
      this.reportPerformanceIssue('slow_page_load', {
        loadTime: totalTime,
        threshold: this.thresholds.pageLoadTime
      });
    }
  }

  monitorAPICalls() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.apiCalls.push({
          url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration,
          timestamp: new Date().toISOString(),
          success: response.ok
        });
        
        this.checkAPIPerformance(duration, url);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.apiCalls.push({
          url,
          method: args[1]?.method || 'GET',
          status: 'error',
          duration,
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        });
        
        this.reportPerformanceIssue('api_error', {
          url,
          error: error.message,
          duration
        });
        
        throw error;
      }
    };
  }

  checkAPIPerformance(duration, url) {
    if (duration > this.thresholds.apiResponseTime) {
      this.reportPerformanceIssue('slow_api_call', {
        url,
        duration,
        threshold: this.thresholds.apiResponseTime
      });
    }
  }

  monitorUserInteractions() {
    const interactionTypes = ['click', 'keydown', 'scroll', 'resize'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        this.metrics.userInteractions.push({
          type,
          target: event.target.tagName,
          timestamp: new Date().toISOString(),
          x: event.clientX || 0,
          y: event.clientY || 0
        });
      }, { passive: true });
    });
  }

  monitorErrors() {
    window.addEventListener('error', (event) => {
      this.metrics.errors.push({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      });
      
      this.checkErrorRate();
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errors.push({
        type: 'unhandled_promise_rejection',
        reason: event.reason?.toString(),
        timestamp: new Date().toISOString()
      });
      
      this.checkErrorRate();
    });
  }

  checkErrorRate() {
    const totalInteractions = this.metrics.userInteractions.length;
    const totalErrors = this.metrics.errors.length;
    
    if (totalInteractions > 0) {
      const errorRate = totalErrors / totalInteractions;
      
      if (errorRate > this.thresholds.errorRate) {
        this.reportPerformanceIssue('high_error_rate', {
          errorRate,
          threshold: this.thresholds.errorRate,
          totalErrors,
          totalInteractions
        });
      }
    }
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = performance.memory;
        
        this.metrics.memoryUsage.push({
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          timestamp: new Date().toISOString()
        });
        
        this.checkMemoryUsage(memoryInfo.usedJSHeapSize);
      }, 30000); // Check every 30 seconds
    }
  }

  checkMemoryUsage(usedMemory) {
    if (usedMemory > this.thresholds.memoryUsage) {
      this.reportPerformanceIssue('high_memory_usage', {
        usedMemory,
        threshold: this.thresholds.memoryUsage
      });
    }
  }

  monitorNetworkRequests() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.metrics.networkRequests.push({
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: entry.initiatorType,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }

  setupReporting() {
    // Report metrics every 5 minutes
    setInterval(() => {
      this.generateReport();
    }, 300000);
    
    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.generateReport();
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      summary: this.generateSummary()
    };
    
    this.sendReport(report);
  }

  generateSummary() {
    const apiCalls = this.metrics.apiCalls;
    const errors = this.metrics.errors;
    const interactions = this.metrics.userInteractions;
    
    return {
      totalAPICalls: apiCalls.length,
      averageAPITime: apiCalls.length > 0 ? 
        apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length : 0,
      apiSuccessRate: apiCalls.length > 0 ? 
        apiCalls.filter(call => call.success).length / apiCalls.length : 1,
      totalErrors: errors.length,
      totalInteractions: interactions.length,
      errorRate: interactions.length > 0 ? errors.length / interactions.length : 0,
      pageLoadTime: this.metrics.pageLoad.totalTime || 0
    };
  }

  sendReport(report) {
    // Store locally for debugging (analytics endpoint not implemented yet)
    localStorage.setItem('performance_report', JSON.stringify(report));
    console.log('📊 Performance report stored locally:', report.summary);
  }

  reportPerformanceIssue(type, details) {
    const issue = {
      type,
      details,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    console.warn('Performance issue detected:', issue);
    
    // Store issue for reporting
    const issues = JSON.parse(localStorage.getItem('performance_issues') || '[]');
    issues.push(issue);
    localStorage.setItem('performance_issues', JSON.stringify(issues));
  }

  // Public methods for manual monitoring
  startCustomTimer(name) {
    performance.mark(`${name}-start`);
  }

  endCustomTimer(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    return measure.duration;
  }

  getMetrics() {
    return this.metrics;
  }

  getSummary() {
    return this.generateSummary();
  }

  clearMetrics() {
    this.metrics = {
      pageLoad: {},
      apiCalls: [],
      userInteractions: [],
      errors: [],
      memoryUsage: [],
      networkRequests: []
    };
  }
}

// Initialize performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Expose performance monitoring to global scope for debugging
window.getPerformanceMetrics = () => window.performanceMonitor.getMetrics();
window.getPerformanceSummary = () => window.performanceMonitor.getSummary();
