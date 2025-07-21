/**
 * POS Payment Management Module
 */

import { apiPost, API_ENDPOINTS } from '../core/api.js';
import { showToast, showLoading, hideLoading } from '../core/notifications.js';
import { formatCurrency } from '../core/utils.js';

export class PaymentManager {
    constructor() {
        this.paymentMethods = [
            { value: 'CASH', label: 'Tiền mặt', icon: 'fas fa-money-bill-wave' },
            { value: 'CARD', label: 'Thẻ', icon: 'fas fa-credit-card' },
            { value: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: 'fas fa-university' },
            { value: 'E_WALLET', label: 'Ví điện tử', icon: 'fas fa-mobile-alt' }
        ];
        this.selectedMethod = 'CASH';
        this.lastTransaction = null;
    }

    setPaymentMethod(method) {
        this.selectedMethod = method;
        this.updatePaymentMethodUI();
    }

    updatePaymentMethodUI() {
        const buttons = document.querySelectorAll('.payment-method-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.method === this.selectedMethod) {
                btn.classList.add('active');
            }
        });
    }

    async processPayment(orderData) {
        try {
            showLoading();
            
            // Validate order data
            if (!this.validateOrderData(orderData)) {
                return false;
            }

            // Add payment method to order data
            const paymentData = {
                ...orderData,
                paymentMethod: this.selectedMethod,
                status: 'COMPLETED' // For POS orders, they are immediately completed
            };

            // Send order to backend
            const response = await apiPost(API_ENDPOINTS.ORDERS.CREATE, paymentData);
            
            if (response.success) {
                this.lastTransaction = {
                    orderId: response.data.order.id,
                    orderNumber: response.data.order.orderNumber,
                    total: response.data.order.total,
                    paymentMethod: this.selectedMethod,
                    timestamp: new Date()
                };

                showToast('Thanh toán thành công!', 'success');
                this.showPaymentSuccessModal();
                return true;
            } else {
                showToast(response.message || 'Có lỗi xảy ra khi xử lý thanh toán', 'error');
                return false;
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            showToast('Không thể xử lý thanh toán. Vui lòng thử lại.', 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    validateOrderData(orderData) {
        if (!orderData.items || orderData.items.length === 0) {
            showToast('Giỏ hàng trống', 'error');
            return false;
        }

        if (orderData.total <= 0) {
            showToast('Tổng tiền không hợp lệ', 'error');
            return false;
        }

        // Validate payment method
        const validMethods = this.paymentMethods.map(m => m.value);
        if (!validMethods.includes(this.selectedMethod)) {
            showToast('Phương thức thanh toán không hợp lệ', 'error');
            return false;
        }

        return true;
    }

    showPaymentSuccessModal() {
        if (!this.lastTransaction) return;

        // Update modal content
        const orderNumberEl = document.getElementById('order-number');
        const paymentTotalEl = document.getElementById('payment-total');
        const paymentMethodTextEl = document.getElementById('payment-method-text');

        if (orderNumberEl) {
            orderNumberEl.textContent = this.lastTransaction.orderNumber;
        }
        if (paymentTotalEl) {
            paymentTotalEl.textContent = formatCurrency(this.lastTransaction.total);
        }
        if (paymentMethodTextEl) {
            const method = this.paymentMethods.find(m => m.value === this.lastTransaction.paymentMethod);
            paymentMethodTextEl.textContent = method ? method.label : this.lastTransaction.paymentMethod;
        }

        // Show modal
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hidePaymentModal() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    printReceipt() {
        if (!this.lastTransaction) {
            showToast('Không có giao dịch để in', 'error');
            return;
        }

        // In a real implementation, this would connect to a receipt printer
        // For now, we'll create a print-friendly window
        this.createPrintableReceipt();
    }

    createPrintableReceipt() {
        if (!this.lastTransaction) return;

        const receiptWindow = window.open('', '_blank', 'width=300,height=600');
        const receiptHTML = this.generateReceiptHTML();
        
        receiptWindow.document.write(receiptHTML);
        receiptWindow.document.close();
        receiptWindow.focus();
        receiptWindow.print();
        receiptWindow.close();
    }

    generateReceiptHTML() {
        if (!this.lastTransaction) return '';

        const now = new Date();
        const method = this.paymentMethods.find(m => m.value === this.lastTransaction.paymentMethod);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Hóa đơn - ${this.lastTransaction.orderNumber}</title>
                <style>
                    body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .line { border-bottom: 1px dashed #000; margin: 5px 0; }
                    .row { display: flex; justify-content: space-between; margin: 2px 0; }
                    .total { font-size: 14px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="center bold">
                    <h2>POS SYSTEM</h2>
                    <p>HÓA ĐƠN BÁN HÀNG</p>
                </div>
                <div class="line"></div>
                <div class="row">
                    <span>Số hóa đơn:</span>
                    <span class="bold">${this.lastTransaction.orderNumber}</span>
                </div>
                <div class="row">
                    <span>Ngày:</span>
                    <span>${now.toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="row">
                    <span>Giờ:</span>
                    <span>${now.toLocaleTimeString('vi-VN')}</span>
                </div>
                <div class="line"></div>
                <!-- Order items would be added here -->
                <div class="line"></div>
                <div class="row total">
                    <span>TỔNG CỘNG:</span>
                    <span>${formatCurrency(this.lastTransaction.total)}</span>
                </div>
                <div class="row">
                    <span>Thanh toán:</span>
                    <span>${method ? method.label : this.lastTransaction.paymentMethod}</span>
                </div>
                <div class="line"></div>
                <div class="center">
                    <p>Cảm ơn quý khách!</p>
                    <p>Hẹn gặp lại!</p>
                </div>
            </body>
            </html>
        `;
    }

    getLastTransaction() {
        return this.lastTransaction;
    }

    getPaymentMethods() {
        return this.paymentMethods;
    }

    getSelectedMethod() {
        return this.selectedMethod;
    }

    // Quick payment shortcuts
    quickPay(amount) {
        // For quick cash payments
        if (this.selectedMethod === 'CASH') {
            showToast(`Nhận ${formatCurrency(amount)} tiền mặt`, 'info');
        }
    }

    calculateChange(amountPaid, total) {
        const change = amountPaid - total;
        return change > 0 ? change : 0;
    }
}

export default PaymentManager;
