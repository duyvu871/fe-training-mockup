/**
 * Notifications Module - Handles toast notifications and loading states
 */

/**
 * Show loading overlay
 */
export function showLoading(message = 'Đang xử lý...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const messageElement = overlay.querySelector('span');
        if (messageElement) {
            messageElement.textContent = message;
        }
        overlay.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Create toast notification element
 */
function createToastElement(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    
    // Base classes
    const baseClasses = 'flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full bg-white border-l-4 border-gray-200 text-gray-800';
    
    // Type-specific classes
    const typeClasses = {
        success: 'bg-green-100 border border-green-200 text-green-800',
        error: 'bg-red-100 border border-red-200 text-red-800',
        warning: 'bg-yellow-100 border border-yellow-200 text-yellow-800',
        info: 'bg-blue-100 border border-blue-200 text-blue-800'
    };
    
    // Type-specific icons
    const typeIcons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.className = `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
    
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="${typeIcons[type] || typeIcons.info} text-lg mr-3"></i>
            <div class="flex-1">
                <p class="font-medium">${message}</p>
            </div>
            <button type="button" class="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    return toast;
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = createToastElement(message, type, duration);
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    }, 100);
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
    
    return toast;
}

/**
 * Remove toast notification
 */
export function removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    
    // Animate out
    toast.classList.remove('translate-x-0', 'opacity-100');
    toast.classList.add('translate-x-full', 'opacity-0');
    
    // Remove from DOM
    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 300);
}

/**
 * Show success toast
 */
export function showSuccess(message, duration = 5000) {
    return showToast(message, 'success', duration);
}

/**
 * Show error toast
 */
export function showError(message, duration = 7000) {
    return showToast(message, 'error', duration);
}

/**
 * Show warning toast
 */
export function showWarning(message, duration = 6000) {
    return showToast(message, 'warning', duration);
}

/**
 * Show info toast
 */
export function showInfo(message, duration = 5000) {
    return showToast(message, 'info', duration);
}

/**
 * Clear all toasts
 */
export function clearToasts() {
    const container = document.getElementById('toast-container');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Show confirmation dialog
 */
export function showConfirm(message, title = 'Xác nhận') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black z-50 flex items-center justify-center p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-question-circle text-yellow-500 text-xl mr-3"></i>
                        <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                    </div>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                            Hủy
                        </button>
                        <button type="button" id="confirm-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('#cancel-btn');
        const confirmBtn = modal.querySelector('#confirm-btn');
        
        const cleanup = () => {
            document.body.removeChild(modal);
        };
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(false);
            }
        });
        
        // Focus confirm button
        confirmBtn.focus();
    });
}

/**
 * Show alert dialog
 */
export function showAlert(message, title = 'Thông báo', type = 'info') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        
        const typeIcons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <i class="${typeIcons[type] || typeIcons.info} text-xl mr-3"></i>
                        <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                    </div>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end">
                        <button type="button" id="ok-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const okBtn = modal.querySelector('#ok-btn');
        
        const cleanup = () => {
            document.body.removeChild(modal);
            resolve();
        };
        
        okBtn.addEventListener('click', cleanup);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup();
            }
        });
        
        // Focus OK button
        okBtn.focus();
    });
}

/**
 * Progress bar utilities
 */
export const Progress = {
    /**
     * Show progress bar
     */
    show(progress = 0, message = 'Đang xử lý...') {
        let progressBar = document.getElementById('progress-bar');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'progress-bar';
            progressBar.className = 'fixed top-0 left-0 right-0 z-50 bg-white shadow-lg';
            progressBar.innerHTML = `
                <div class="p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-700" id="progress-message">${message}</span>
                        <span class="text-sm text-gray-500" id="progress-percent">${progress}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary-600 h-2 rounded-full transition-all duration-300" id="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(progressBar);
        }
        
        this.update(progress, message);
    },
    
    /**
     * Update progress bar
     */
    update(progress, message) {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;
        
        const messageEl = progressBar.querySelector('#progress-message');
        const percentEl = progressBar.querySelector('#progress-percent');
        const fillEl = progressBar.querySelector('#progress-fill');
        
        if (messageEl && message) messageEl.textContent = message;
        if (percentEl) percentEl.textContent = `${progress}%`;
        if (fillEl) fillEl.style.width = `${progress}%`;
    },
    
    /**
     * Hide progress bar
     */
    hide() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            document.body.removeChild(progressBar);
        }
    }
};

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('Có lỗi không mong muốn xảy ra. Vui lòng thử lại.');
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.APP_CONFIG?.environment === 'development') {
        showError(`Lỗi JavaScript: ${event.error?.message || 'Unknown error'}`);
    } else {
        showError('Có lỗi xảy ra. Vui lòng thử lại.');
    }
});
