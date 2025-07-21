/**
 * Register Page JavaScript
 */

import { isAuthenticated } from '../core/auth.js';
import { showToast, showLoading, hideLoading } from '../core/notifications.js';
import { apiPost, API_ENDPOINTS } from '../core/api.js';

class RegisterPage {
    constructor() {
        this.form = document.getElementById('register-form');
        this.usernameInput = document.getElementById('username');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirm-password');
        this.togglePasswordBtn = document.getElementById('toggle-password');
        this.toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
        this.registerButton = document.getElementById('register-button');
        
        this.init();
    }

    init() {
        // Redirect if already authenticated
        if (isAuthenticated()) {
            window.location.href = '/dashboard';
            return;
        }

        this.bindEvents();
        
        // Focus username input
        if (this.usernameInput) {
            this.usernameInput.focus();
        }
    }

    bindEvents() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Toggle password visibility
        if (this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener('click', () => this.togglePassword(this.passwordInput, this.togglePasswordBtn));
        }
        
        if (this.toggleConfirmPasswordBtn) {
            this.toggleConfirmPasswordBtn.addEventListener('click', () => this.togglePassword(this.confirmPasswordInput, this.toggleConfirmPasswordBtn));
        }

        // Real-time validation
        [this.usernameInput, this.emailInput, this.passwordInput, this.confirmPasswordInput].forEach(input => {
            if (input) {
                input.addEventListener('input', this.validateForm.bind(this));
                input.addEventListener('blur', this.validateField.bind(this, input));
            }
        });

        // Username availability check
        if (this.usernameInput) {
            let debounceTimer;
            this.usernameInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.checkUsernameAvailability();
                }, 500);
            });
        }

        // Email format validation
        if (this.emailInput) {
            this.emailInput.addEventListener('blur', () => {
                this.validateEmail();
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(this.form);
        const userData = {
            username: formData.get('username').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            firstName: formData.get('firstName')?.trim() || '',
            lastName: formData.get('lastName')?.trim() || ''
        };

        try {
            this.setLoading(true);
            
            const result = await apiPost(API_ENDPOINTS.AUTH.REGISTER, userData);
            
            showToast('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 'success', 3000);
            
            // Redirect to login page after short delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            
        } catch (error) {
            console.error('Registration failed:', error);
            
            // Show specific error messages
            if (error.message.includes('username') && error.message.includes('taken')) {
                showToast('Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.', 'error');
                this.showFieldError(this.usernameInput, 'Tên đăng nhập đã tồn tại');
            } else if (error.message.includes('email') && error.message.includes('taken')) {
                showToast('Email đã được sử dụng. Vui lòng sử dụng email khác.', 'error');
                this.showFieldError(this.emailInput, 'Email đã được đăng ký');
            } else {
                showToast(error.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
            }
            
        } finally {
            this.setLoading(false);
        }
    }

    validateForm() {
        let isValid = true;
        
        // Reset previous errors
        this.clearErrors();
        
        // Validate all fields
        const validations = [
            this.validateUsername(),
            this.validateEmail(),
            this.validatePassword(),
            this.validateConfirmPassword()
        ];
        
        isValid = validations.every(v => v);
        
        // Update submit button state
        this.updateSubmitButton(isValid);
        
        return isValid;
    }

    validateField(field) {
        if (!field) return true;
        
        switch (field) {
            case this.usernameInput:
                return this.validateUsername();
            case this.emailInput:
                return this.validateEmail();
            case this.passwordInput:
                return this.validatePassword();
            case this.confirmPasswordInput:
                return this.validateConfirmPassword();
            default:
                return true;
        }
    }

    validateUsername() {
        const username = this.usernameInput?.value?.trim();
        
        if (!username) {
            this.showFieldError(this.usernameInput, 'Vui lòng nhập tên đăng nhập');
            return false;
        }
        
        if (username.length < 3) {
            this.showFieldError(this.usernameInput, 'Tên đăng nhập phải có ít nhất 3 ký tự');
            return false;
        }
        
        if (username.length > 20) {
            this.showFieldError(this.usernameInput, 'Tên đăng nhập không được quá 20 ký tự');
            return false;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showFieldError(this.usernameInput, 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới');
            return false;
        }
        
        return true;
    }

    validateEmail() {
        const email = this.emailInput?.value?.trim();
        
        if (!email) {
            this.showFieldError(this.emailInput, 'Vui lòng nhập email');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFieldError(this.emailInput, 'Định dạng email không hợp lệ');
            return false;
        }
        
        return true;
    }

    validatePassword() {
        const password = this.passwordInput?.value;
        
        if (!password) {
            this.showFieldError(this.passwordInput, 'Vui lòng nhập mật khẩu');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError(this.passwordInput, 'Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        
        if (password.length > 50) {
            this.showFieldError(this.passwordInput, 'Mật khẩu không được quá 50 ký tự');
            return false;
        }
        
        // Check password strength
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        if (!hasLetter || !hasNumber) {
            this.showFieldError(this.passwordInput, 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số');
            return false;
        }
        
        return true;
    }

    validateConfirmPassword() {
        const password = this.passwordInput?.value;
        const confirmPassword = this.confirmPasswordInput?.value;
        
        if (!confirmPassword) {
            this.showFieldError(this.confirmPasswordInput, 'Vui lòng xác nhận mật khẩu');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showFieldError(this.confirmPasswordInput, 'Mật khẩu xác nhận không khớp');
            return false;
        }
        
        return true;
    }

    async checkUsernameAvailability() {
        const username = this.usernameInput?.value?.trim();
        
        if (!username || username.length < 3) {
            return;
        }
        
        try {
            // This would call an API endpoint to check username availability
            // For now, we'll skip this as the endpoint might not exist yet
            console.log('Checking username availability for:', username);
        } catch (error) {
            console.warn('Could not check username availability:', error);
        }
    }

    showFieldError(field, message) {
        if (!field) return;
        
        // Clear previous error for this field
        const existingError = field.parentNode.querySelector(`[data-error-for="${field.id}"]`);
        if (existingError) {
            existingError.remove();
        }
        
        // Add error styling
        field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-gray-300', 'focus:border-primary-500', 'focus:ring-primary-500');
        
        // Show error message
        const errorElement = document.createElement('p');
        errorElement.className = 'mt-1 text-sm text-red-600';
        errorElement.textContent = message;
        errorElement.setAttribute('data-error-for', field.id);
        
        field.parentNode.appendChild(errorElement);
    }

    clearErrors() {
        // Remove error styling
        [this.usernameInput, this.emailInput, this.passwordInput, this.confirmPasswordInput].forEach(field => {
            if (field) {
                field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
                field.classList.add('border-gray-300', 'focus:border-primary-500', 'focus:ring-primary-500');
            }
        });
        
        // Remove error messages
        document.querySelectorAll('[data-error-for]').forEach(el => {
            el.remove();
        });
    }

    updateSubmitButton(isValid) {
        if (!this.registerButton) return;
        
        const allFieldsFilled = this.usernameInput?.value?.trim() && 
                               this.emailInput?.value?.trim() && 
                               this.passwordInput?.value && 
                               this.confirmPasswordInput?.value;
        
        if (isValid && allFieldsFilled) {
            this.registerButton.disabled = false;
            this.registerButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            this.registerButton.disabled = true;
            this.registerButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    togglePassword(input, button) {
        if (!input || !button) return;
        
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = isPassword ? 'fas fa-eye-slash text-gray-400 hover:text-gray-600' : 'fas fa-eye text-gray-400 hover:text-gray-600';
        }
    }

    setLoading(loading) {
        if (!this.registerButton) return;
        
        if (loading) {
            this.registerButton.disabled = true;
            this.registerButton.innerHTML = `
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang đăng ký...
                </div>
            `;
            showLoading('Đang tạo tài khoản...');
        } else {
            this.registerButton.disabled = false;
            this.registerButton.innerHTML = `
                <i class="fas fa-user-plus mr-2"></i>
                Đăng ký
            `;
            hideLoading();
        }
    }
}

// Initialize register page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RegisterPage();
});

// Handle browser back button
window.addEventListener('pageshow', (event) => {
    if (event.persisted && isAuthenticated()) {
        window.location.href = '/dashboard';
    }
});
