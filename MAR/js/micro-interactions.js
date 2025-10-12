/**
 * Micro-interactions and UI Animations for Maverick Aim Rush
 * Adds delightful animations and feedback throughout the application
 */

class MicroInteractions {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupClickAnimations();
        this.setupHoverEffects();
        this.setupScrollAnimations();
        this.setupFormAnimations();
        this.setupNumberCounters();
        this.setupProgressAnimations();
        this.setupParticleEffects();
        this.setupSuccessAnimations();
    }
    
    // ===== CLICK ANIMATIONS =====
    setupClickAnimations() {
        document.addEventListener('click', (e) => {
            const element = e.target;
            
            // Add ripple effect to buttons
            if (element.tagName === 'BUTTON' || element.classList.contains('btn')) {
                this.createRippleEffect(element, e);
            }
            
            // Add click feedback to cards
            if (element.classList.contains('card') || element.closest('.card')) {
                this.createClickFeedback(element);
            }
        });
    }
    
    createRippleEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleAnimation 0.6s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        element.style.position = element.style.position || 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    createClickFeedback(element) {
        element.style.transform = 'scale(0.98)';
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
    }
    
    // ===== HOVER EFFECTS =====
    setupHoverEffects() {
        // Add magnetic effect to buttons
        document.querySelectorAll('.btn, button').forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
            });
        });
    }
    
    // ===== SCROLL ANIMATIONS =====
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    
                    // Stagger animations for multiple elements
                    if (entry.target.parentElement.classList.contains('grid')) {
                        const siblings = Array.from(entry.target.parentElement.children);
                        const index = siblings.indexOf(entry.target);
                        entry.target.style.animationDelay = `${index * 0.1}s`;
                    }
                }
            });
        }, observerOptions);
        
        // Observe cards and important elements
        document.querySelectorAll('.card, .stat-card, .kpi-card, .settings-section').forEach(el => {
            observer.observe(el);
        });
    }
    
    // ===== FORM ANIMATIONS =====
    setupFormAnimations() {
        document.querySelectorAll('input, textarea, select').forEach(input => {
            // Focus animations
            input.addEventListener('focus', () => {
                input.style.transform = 'scale(1.02)';
                input.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.2)';
            });
            
            input.addEventListener('blur', () => {
                input.style.transform = '';
                input.style.boxShadow = '';
            });
            
            // Success animation on valid input
            input.addEventListener('input', () => {
                if (input.validity.valid && input.value.length > 0) {
                    this.createSuccessEffect(input);
                }
            });
        });
    }
    
    createSuccessEffect(element) {
        const checkmark = document.createElement('div');
        checkmark.innerHTML = '✓';
        checkmark.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%) scale(0);
            color: #10b981;
            font-weight: bold;
            animation: successPop 0.5s ease-out forwards;
            pointer-events: none;
        `;
        
        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(checkmark);
        
        setTimeout(() => checkmark.remove(), 2000);
    }
    
    // ===== NUMBER COUNTERS =====
    setupNumberCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                }
            });
        });
        
        counters.forEach(counter => observer.observe(counter));
    }
    
    animateCounter(element) {
        const target = parseInt(element.dataset.counter) || parseInt(element.textContent) || 0;
        const duration = 2000;
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * target);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // ===== PROGRESS ANIMATIONS =====
    setupProgressAnimations() {
        document.querySelectorAll('.progress-bar, .progress-fill').forEach(bar => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const width = bar.dataset.width || bar.style.width || '0%';
                        bar.style.width = '0%';
                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);
                    }
                });
            });
            
            observer.observe(bar);
        });
    }
    
    // ===== PARTICLE EFFECTS =====
    setupParticleEffects() {
        // Add particles on achievement unlock
        document.addEventListener('achievement-unlock', (e) => {
            this.createParticleExplosion(e.detail.element);
        });
        
        // Add particles on level up
        document.addEventListener('level-up', (e) => {
            this.createLevelUpParticles();
        });
    }
    
    createParticleExplosion(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 8px;
                height: 8px;
                background: ${this.getRandomColor()};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                animation: particleExplosion 1s ease-out forwards;
            `;
            
            const angle = (i / 15) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            particle.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);
            
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    createLevelUpParticles() {
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.innerHTML = ['⭐', '✨', '🎉', '🎊'][Math.floor(Math.random() * 4)];
                particle.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * window.innerWidth}px;
                    top: -50px;
                    font-size: ${Math.random() * 20 + 10}px;
                    pointer-events: none;
                    z-index: 1000;
                    animation: particleFall ${Math.random() * 3 + 2}s linear forwards;
                `;
                
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 5000);
            }, i * 100);
        }
    }
    
    getRandomColor() {
        const colors = ['#ff6b35', '#f7931e', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // ===== SUCCESS ANIMATIONS =====
    setupSuccessAnimations() {
        // Listen for custom success events
        document.addEventListener('success-action', (e) => {
            this.showSuccessAnimation(e.detail.message, e.detail.element);
        });
    }
    
    showSuccessAnimation(message, element) {
        const successMessage = document.createElement('div');
        successMessage.textContent = message;
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
            z-index: 1000;
            animation: slideInSuccess 0.5s ease-out forwards;
            font-weight: 500;
        `;
        
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.style.animation = 'slideOutSuccess 0.5s ease-out forwards';
            setTimeout(() => successMessage.remove(), 500);
        }, 3000);
    }
    
    // ===== UTILITY METHODS =====
    
    // Trigger achievement unlock animation
    triggerAchievementUnlock(badgeName, element) {
        const event = new CustomEvent('achievement-unlock', {
            detail: { badgeName, element }
        });
        document.dispatchEvent(event);
    }
    
    // Trigger level up animation
    triggerLevelUp(newLevel) {
        const event = new CustomEvent('level-up', {
            detail: { newLevel }
        });
        document.dispatchEvent(event);
    }
    
    // Trigger success action
    triggerSuccess(message, element) {
        const event = new CustomEvent('success-action', {
            detail: { message, element }
        });
        document.dispatchEvent(event);
    }
    
    // Add loading animation to element
    addLoadingAnimation(element, message = 'Loading...') {
        const loader = document.createElement('div');
        loader.style.cssText = `
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: inherit;
            backdrop-filter: blur(2px);
        `;
        
        loader.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-sm font-medium text-gray-600">${message}</span>
            </div>
        `;
        
        element.style.position = element.style.position || 'relative';
        element.appendChild(loader);
        
        return loader;
    }
    
    // Remove loading animation
    removeLoadingAnimation(element) {
        const loader = element.querySelector('[style*="position: absolute"][style*="inset: 0"]');
        if (loader) {
            loader.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => loader.remove(), 300);
        }
    }
    
    // Smooth scroll to element
    smoothScrollTo(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Add highlight effect
        element.style.animation = 'highlight 1s ease-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 1000);
    }
}

// Add CSS animations dynamically
const microInteractionsStyle = document.createElement('style');
microInteractionsStyle.textContent = `
    @keyframes rippleAnimation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes particleExplosion {
        to {
            transform: translate(var(--end-x), var(--end-y)) scale(0);
            opacity: 0;
        }
    }
    
    @keyframes particleFall {
        to {
            transform: translateY(${window.innerHeight + 100}px) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes slideInSuccess {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutSuccess {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes successPop {
        from {
            transform: translateY(-50%) scale(0);
            opacity: 0;
        }
        to {
            transform: translateY(-50%) scale(1);
            opacity: 1;
        }
    }
    
    @keyframes highlight {
        0%, 100% { box-shadow: inherit; }
        50% { box-shadow: 0 0 20px rgba(255, 107, 53, 0.5); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    /* Enhanced hover effects */
    .hover-lift {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .hover-lift:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }
    
    .hover-glow:hover {
        box-shadow: 0 0 30px rgba(255, 107, 53, 0.3);
    }
    
    /* Stagger animation delays */
    .stagger-1 { animation-delay: 0.1s; }
    .stagger-2 { animation-delay: 0.2s; }
    .stagger-3 { animation-delay: 0.3s; }
    .stagger-4 { animation-delay: 0.4s; }
    .stagger-5 { animation-delay: 0.5s; }
`;

document.head.appendChild(microInteractionsStyle);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.microInteractions = new MicroInteractions();
    
    // Add stagger classes to grid items
    document.querySelectorAll('.grid > *').forEach((item, index) => {
        item.classList.add(`stagger-${Math.min(index + 1, 5)}`);
    });
});
