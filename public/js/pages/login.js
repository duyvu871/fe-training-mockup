/**
 * Login Page JavaScript
 */

import { login, isAuthenticated } from '../core/auth.js';
import { showToast, showLoading, hideLoading } from '../core/notifications.js';

class LoginPage {
    constructor() {
        this.form = document.getElementById('login-form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('toggle-password');
        this.loginButton = document.getElementById('login-button');
        this.rememberMeCheckbox = document.getElementById('remember-me');
        
        this.init();
    }

    init() {
        // Redirect if already authenticated
        if (isAuthenticated()) {
            window.location.href = '/dashboard';
            return;
        }

        this.bindEvents();
        this.loadRememberedCredentials();
        
        // Focus email input
        if (this.emailInput) {
            this.emailInput.focus();
        }
    }

    bindEvents() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Toggle password visibility
        if (this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener('click', this.togglePassword.bind(this));
        }

        // Enter key handling
        if (this.passwordInput) {
            this.passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSubmit(e);
                }
            });
        }

        // Real-time validation
        if (this.emailInput) {
            this.emailInput.addEventListener('input', this.validateForm.bind(this));
        }
        
        if (this.passwordInput) {
            this.passwordInput.addEventListener('input', this.validateForm.bind(this));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(this.form);
        const credentials = {
            email: formData.get('email').trim(),
            password: formData.get('password')
        };

        try {
            this.setLoading(true);
            
            const result = await login(credentials);
            
            // Save credentials if remember me is checked
            if (this.rememberMeCheckbox?.checked) {
                this.saveCredentials(credentials.email);
            } else {
                this.clearSavedCredentials();
            }

            // Show success message
            showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success', 2000);
            
            // Redirect after short delay
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
                window.location.href = redirectUrl;
            }, 1000);
            
        } catch (error) {
            console.error('Login failed:', error);
            
            // Show specific error messages
            if (error.message.includes('credentials')) {
                showToast('Tên đăng nhập hoặc mật khẩu không đúng', 'error');
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                showToast('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.', 'error');
            } else {
                showToast(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.', 'error');
            }
            
            // Focus password input for retry
            if (this.passwordInput) {
                this.passwordInput.focus();
                this.passwordInput.select();
            }
            
        } finally {
            this.setLoading(false);
        }
    }

    validateForm() {
        let isValid = true;
        
        // Reset previous errors
        this.clearErrors();
        
        // Validate email
        const email = this.emailInput?.value?.trim();
        if (!email) {
            this.showFieldError(this.emailInput, 'Vui lòng nhập email');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError(this.emailInput, 'Email không hợp lệ');
            isValid = false;
        }
        
        // Validate password
        const password = this.passwordInput?.value;
        if (!password) {
            this.showFieldError(this.passwordInput, 'Vui lòng nhập mật khẩu');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError(this.passwordInput, 'Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }
        
        // Update submit button state
        this.updateSubmitButton(isValid);
        
        return isValid;
    }

    showFieldError(field, message) {
        if (!field) return;
        
        // Add error styling
        field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-gray-300', 'focus:border-primary-500', 'focus:ring-primary-500');
        
        // Show error message
        const errorElement = document.createElement('p');
        errorElement.className = 'mt-1 text-sm text-red-600';
        errorElement.textContent = message;
        errorElement.setAttribute('data-error', 'true');
        
        field.parentNode.appendChild(errorElement);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    clearErrors() {
        // Remove error styling
        [this.emailInput, this.passwordInput].forEach(field => {
            if (field) {
                field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
                field.classList.add('border-gray-300', 'focus:border-primary-500', 'focus:ring-primary-500');
            }
        });
        
        // Remove error messages
        document.querySelectorAll('[data-error="true"]').forEach(el => {
            el.remove();
        });
    }

    updateSubmitButton(isValid) {
        if (!this.loginButton) return;
        
        if (isValid && this.emailInput?.value?.trim() && this.passwordInput?.value) {
            this.loginButton.disabled = false;
            this.loginButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            this.loginButton.disabled = true;
            this.loginButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    togglePassword() {
        if (!this.passwordInput || !this.togglePasswordBtn) return;
        
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        const icon = this.togglePasswordBtn.querySelector('i');
        if (icon) {
            icon.className = isPassword ? 'fas fa-eye-slash text-gray-400 hover:text-gray-600' : 'fas fa-eye text-gray-400 hover:text-gray-600';
        }
    }

    setLoading(loading) {
        if (!this.loginButton) return;
        
        if (loading) {
            this.loginButton.disabled = true;
            this.loginButton.innerHTML = `
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang đăng nhập...
                </div>
            `;
            showLoading('Đang xác thực thông tin...');
        } else {
            this.loginButton.disabled = false;
            this.loginButton.innerHTML = `
                <i class="fas fa-sign-in-alt mr-2"></i>
                Đăng nhập
            `;
            hideLoading();
        }
    }

    saveCredentials(email) {
        try {
            localStorage.setItem('remembered_email', email);
            localStorage.setItem('remember_login', 'true');
        } catch (error) {
            console.warn('Could not save credentials:', error);
        }
    }

    clearSavedCredentials() {
        try {
            localStorage.removeItem('remembered_email');
            localStorage.removeItem('remember_login');
        } catch (error) {
            console.warn('Could not clear saved credentials:', error);
        }
    }

    loadRememberedCredentials() {
        try {
            const rememberLogin = localStorage.getItem('remember_login') === 'true';
            const rememberedEmail = localStorage.getItem('remembered_email');
            
            if (rememberLogin && rememberedEmail) {
                if (this.emailInput) {
                    this.emailInput.value = rememberedEmail;
                }
                if (this.rememberMeCheckbox) {
                    this.rememberMeCheckbox.checked = true;
                }
                // Focus password field if email is pre-filled
                if (this.passwordInput) {
                    this.passwordInput.focus();
                }
            }
        } catch (error) {
            console.warn('Could not load remembered credentials:', error);
        }
    }
}

// Initialize login page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});

// Handle browser back button
window.addEventListener('pageshow', (event) => {
    if (event.persisted && isAuthenticated()) {
        window.location.href = '/dashboard';
    }
});
