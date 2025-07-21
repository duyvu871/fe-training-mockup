/**
 * Admin Sidebar JavaScript
 * Handles sidebar toggle for mobile and desktop
 */

class AdminSidebar {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.mobileMenuButton = document.getElementById('mobile-menu-button');
        this.overlay = null;
        
        this.init();
    }
    
    init() {
        this.createOverlay();
        this.bindEvents();
        this.handleResize();
    }
    
    createOverlay() {
        // Create overlay for mobile
        this.overlay = document.createElement('div');
        this.overlay.id = 'sidebar-overlay';
        this.overlay.className = 'fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden';
        this.overlay.style.display = 'none';
        document.body.appendChild(this.overlay);
        
        // Close sidebar when clicking overlay
        this.overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
    }
    
    bindEvents() {
        // Mobile menu button
        if (this.mobileMenuButton) {
            this.mobileMenuButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
            }
        });
    }
    
    toggleSidebar() {
        if (this.isSidebarOpen()) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    openSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('-translate-x-full');
            this.sidebar.classList.add('translate-x-0');
        }
        
        if (this.overlay && window.innerWidth < 768) {
            this.overlay.style.display = 'block';
            setTimeout(() => {
                this.overlay.style.opacity = '1';
            }, 10);
        }
        
        // Prevent body scroll on mobile
        if (window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.add('-translate-x-full');
            this.sidebar.classList.remove('translate-x-0');
        }
        
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 300);
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
    
    isSidebarOpen() {
        return this.sidebar && !this.sidebar.classList.contains('-translate-x-full');
    }
    
    handleResize() {
        // On desktop, always show sidebar and hide overlay
        if (window.innerWidth >= 768) {
            if (this.sidebar) {
                this.sidebar.classList.remove('-translate-x-full');
                this.sidebar.classList.add('translate-x-0');
            }
            if (this.overlay) {
                this.overlay.style.display = 'none';
            }
            document.body.style.overflow = '';
        } else {
            // On mobile, start with sidebar hidden
            if (this.sidebar && !this.isSidebarOpen()) {
                this.sidebar.classList.add('-translate-x-full');
                this.sidebar.classList.remove('translate-x-0');
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminSidebar();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminSidebar;
}
