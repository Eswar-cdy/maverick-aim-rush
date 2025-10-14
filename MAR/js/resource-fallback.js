// Resource fallback handler
document.addEventListener('DOMContentLoaded', function() {
  // Check for missing CSS files
  const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
  cssLinks.forEach(link => {
    link.addEventListener('error', function() {
      console.warn('CSS file failed to load:', this.href);
      // Apply fallback styles
      this.insertAdjacentHTML('afterend', `
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
          .grid { display: grid; gap: 1rem; }
          .flex { display: flex; }
        </style>
      `);
    });
  });
  
  // Handle navigation errors
  window.addEventListener('error', function(e) {
    if (e.message.includes('history') || e.message.includes('navigation')) {
      console.warn('Navigation error handled:', e.message);
      // Provide fallback navigation
      if (!document.querySelector('.fallback-nav')) {
        const fallbackNav = document.createElement('div');
        fallbackNav.className = 'fallback-nav';
        fallbackNav.innerHTML = '<a href="index.html">← Back to Dashboard</a>';
        fallbackNav.style.cssText = 'position: fixed; top: 10px; left: 10px; z-index: 9999; background: #ff6b35; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;';
        document.body.appendChild(fallbackNav);
      }
    }
  });
});
