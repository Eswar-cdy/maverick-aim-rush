// Mobile optimization and PWA functionality
class MobileOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.setupTouchOptimizations();
    this.setupPWAFeatures();
    this.setupMobileNavigation();
    this.setupPerformanceOptimizations();
  }

  setupTouchOptimizations() {
    // Prevent double-tap zoom on buttons
    document.addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('button') || 
          e.target.classList.contains('header__nav-link')) {
        e.preventDefault();
        e.target.click();
      }
    }, { passive: false });

    // Add touch feedback to interactive elements
    const touchElements = document.querySelectorAll('.button, .header__nav-link, .form-input');
    touchElements.forEach(element => {
      element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.95)';
      });
      
      element.addEventListener('touchend', () => {
        element.style.transform = '';
      });
    });

    // Setup swipe gestures for navigation
    this.setupSwipeGestures();
  }

  setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 50;

      // Only process horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
    }, { passive: true });
  }

  handleSwipeRight() {
    // Swipe right - go back or close mobile menu
    const mobileMenu = document.querySelector('.header__navigation');
    if (mobileMenu && mobileMenu.style.display === 'flex') {
      mobileMenu.style.display = 'none';
      return;
    }
    
    // Safe navigation back with error handling
    try {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback to home page if no history
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.warn('Navigation error:', error);
      // Fallback to home page
      window.location.href = 'index.html';
    }
  }

  handleSwipeLeft() {
    // Swipe left - open mobile menu or go forward
    const mobileMenu = document.querySelector('.header__navigation');
    if (window.innerWidth <= 768 && mobileMenu && mobileMenu.style.display === 'none') {
      this.toggleMobileMenu();
      return;
    }
    
    // Go forward in browser history if possible
    if (window.history.length > 1) {
      window.history.forward();
    }
  }

  setupPWAFeatures() {
    // Install prompt handling
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallButton();
    });

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.hideInstallButton();
    });

    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.body.classList.add('standalone-mode');
    }
  }

  showInstallButton() {
    // Create install button if it doesn't exist
    if (!document.getElementById('install-button')) {
      const installBtn = document.createElement('button');
      installBtn.id = 'install-button';
      installBtn.className = 'button install-button';
      installBtn.innerHTML = '📱 Install App';
      installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        background: linear-gradient(45deg, #ff6b35, #f7931e);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 12px 20px;
        font-family: 'Righteous', cursive;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
      `;
      
      installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            this.hideInstallButton();
          });
        }
      });
      
      document.body.appendChild(installBtn);
    }
  }

  hideInstallButton() {
    const installBtn = document.getElementById('install-button');
    if (installBtn) {
      installBtn.remove();
    }
  }

  setupMobileNavigation() {
    // Create mobile menu toggle
    const header = document.querySelector('.header');
    if (header && window.innerWidth <= 768) {
      this.createMobileMenu();
    }

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
  }

  createMobileMenu() {
    const headerNav = document.querySelector('.header__navigation');
    if (!headerNav || document.getElementById('mobile-menu-toggle')) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'mobile-menu-toggle';
    toggleBtn.innerHTML = '☰';
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.style.cssText = `
      display: none;
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
    `;

    const headerContent = document.querySelector('.header__content');
    if (headerContent) {
      headerContent.appendChild(toggleBtn);
    }

    // Show/hide mobile menu toggle based on screen size
    const checkScreenSize = () => {
      if (window.innerWidth <= 768) {
        toggleBtn.style.display = 'block';
        headerNav.style.display = 'none';
      } else {
        toggleBtn.style.display = 'none';
        headerNav.style.display = 'flex';
      }
    };

    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();

    // Toggle mobile menu
    toggleBtn.addEventListener('click', () => {
      this.toggleMobileMenu();
    });
  }

  toggleMobileMenu() {
    const headerNav = document.querySelector('.header__navigation');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    
    if (!headerNav) return;
    
    if (headerNav.style.display === 'none' || headerNav.style.display === '') {
      headerNav.style.display = 'flex';
      headerNav.style.flexDirection = 'column';
      headerNav.style.position = 'absolute';
      headerNav.style.top = '100%';
      headerNav.style.left = '0';
      headerNav.style.right = '0';
      headerNav.style.background = 'rgba(10, 35, 66, 0.95)';
      headerNav.style.padding = '1rem';
      headerNav.style.zIndex = '1000';
      headerNav.style.backdropFilter = 'blur(10px)';
      headerNav.style.borderRadius = '0 0 15px 15px';
      headerNav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
      
      if (toggleBtn) {
        toggleBtn.innerHTML = '✕';
        toggleBtn.style.transform = 'rotate(90deg)';
      }
    } else {
      headerNav.style.display = 'none';
      
      if (toggleBtn) {
        toggleBtn.innerHTML = '☰';
        toggleBtn.style.transform = 'rotate(0deg)';
      }
    }
  }

  handleOrientationChange() {
    // Adjust layout for orientation changes
    const isLandscape = window.innerWidth > window.innerHeight;
    
    if (isLandscape) {
      document.body.classList.add('landscape-mode');
    } else {
      document.body.classList.remove('landscape-mode');
    }

    // Recalculate mobile menu
    this.createMobileMenu();
  }

  setupPerformanceOptimizations() {
    // Lazy load images
    this.lazyLoadImages();
    
    // Optimize scroll performance
    this.optimizeScroll();
    
    // Preload critical resources
    this.preloadResources();
    
    // Setup accessibility features
    this.setupAccessibility();
    
    // Setup advanced mobile features
    this.setupAdvancedMobileFeatures();
  }

  setupAccessibility() {
    // Add ARIA labels for mobile navigation
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
      mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
      mobileToggle.setAttribute('aria-expanded', 'false');
    }

    // Add focus management for mobile menu
    const headerNav = document.querySelector('.header__navigation');
    if (headerNav) {
      headerNav.setAttribute('role', 'navigation');
      headerNav.setAttribute('aria-label', 'Main navigation');
    }

    // Add skip links for keyboard navigation
    this.addSkipLinks();
    
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
  }

  addSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #ff6b35;
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // ESC key closes mobile menu
      if (e.key === 'Escape') {
        const headerNav = document.querySelector('.header__navigation');
        if (headerNav && headerNav.style.display === 'flex') {
          this.toggleMobileMenu();
        }
      }
      
      // Tab navigation enhancement
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
    });
  }

  handleTabNavigation(e) {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  setupAdvancedMobileFeatures() {
    // Add pull-to-refresh functionality
    this.setupPullToRefresh();
    
    // Add haptic feedback for supported devices
    this.setupHapticFeedback();
    
    // Add network status monitoring
    this.setupNetworkMonitoring();
    
    // Add battery status monitoring
    this.setupBatteryMonitoring();
  }

  setupPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    const pullThreshold = 100;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (isPulling && window.scrollY === 0) {
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0) {
          e.preventDefault();
          document.body.style.transform = `translateY(${Math.min(pullDistance * 0.5, pullThreshold)}px)`;
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (isPulling) {
        const pullDistance = currentY - startY;
        
        if (pullDistance > pullThreshold) {
          // Trigger refresh
          this.handlePullToRefresh();
        }
        
        document.body.style.transform = '';
        isPulling = false;
      }
    }, { passive: true });
  }

  handlePullToRefresh() {
    // Show refresh indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'refresh-indicator';
    refreshIndicator.innerHTML = '🔄 Refreshing...';
    refreshIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 107, 53, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      z-index: 10000;
      font-family: 'Righteous', cursive;
    `;
    
    document.body.appendChild(refreshIndicator);
    
    // Simulate refresh
    setTimeout(() => {
      document.body.removeChild(refreshIndicator);
      window.location.reload();
    }, 1500);
  }

  setupHapticFeedback() {
    // Add haptic feedback for supported devices
    if ('vibrate' in navigator) {
      const interactiveElements = document.querySelectorAll('.button, .header__nav-link');
      interactiveElements.forEach(element => {
        element.addEventListener('touchstart', () => {
          navigator.vibrate(10); // Short vibration
        });
      });
    }
  }

  setupNetworkMonitoring() {
    // Monitor network status
    if ('onLine' in navigator) {
      const updateNetworkStatus = () => {
        const status = navigator.onLine ? 'online' : 'offline';
        document.body.setAttribute('data-network-status', status);
        
        if (!navigator.onLine) {
          this.showOfflineIndicator();
        } else {
          this.hideOfflineIndicator();
        }
      };
      
      window.addEventListener('online', updateNetworkStatus);
      window.addEventListener('offline', updateNetworkStatus);
      updateNetworkStatus();
    }
  }

  showOfflineIndicator() {
    if (!document.getElementById('offline-indicator')) {
      const indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = '📡 You are offline - some features may be limited';
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b35;
        color: white;
        text-align: center;
        padding: 10px;
        z-index: 10000;
        font-family: 'Righteous', cursive;
        font-size: 14px;
      `;
      document.body.appendChild(indicator);
    }
  }

  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  setupBatteryMonitoring() {
    // Monitor battery status if available
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBatteryStatus = () => {
          if (battery.level < 0.2 && !battery.charging) {
            this.showLowBatteryWarning();
          } else {
            this.hideLowBatteryWarning();
          }
        };
        
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
        updateBatteryStatus();
      });
    }
  }

  showLowBatteryWarning() {
    if (!document.getElementById('battery-warning')) {
      const warning = document.createElement('div');
      warning.id = 'battery-warning';
      warning.innerHTML = '🔋 Low battery - consider charging your device';
      warning.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: rgba(255, 0, 0, 0.9);
        color: white;
        text-align: center;
        padding: 10px;
        border-radius: 10px;
        z-index: 10000;
        font-family: 'Righteous', cursive;
        font-size: 14px;
      `;
      document.body.appendChild(warning);
    }
  }

  hideLowBatteryWarning() {
    const warning = document.getElementById('battery-warning');
    if (warning) {
      warning.remove();
    }
  }

  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  optimizeScroll() {
    let ticking = false;
    
    const updateScrollPosition = () => {
      const scrollTop = window.pageYOffset;
      const header = document.querySelector('.header');
      
      if (header) {
        if (scrollTop > 100) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
      
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    });
  }

  preloadResources() {
    // Preloading disabled to avoid browser warnings
    // The resources will still load normally when needed
    console.log('📱 Preloading disabled to avoid browser warnings');
  }
}

// Initialize mobile optimizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MobileOptimizer();
});

// Export for use in other modules
window.MobileOptimizer = MobileOptimizer;
