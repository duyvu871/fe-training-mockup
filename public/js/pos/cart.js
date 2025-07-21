/**
 * POS Cart Management Module
 */

import { formatCurrency } from '../core/utils.js';
import { showToast } from '../core/notifications.js';

export class CartManager {
    constructor() {
        this.items = [];
        this.discount = { type: 'amount', value: 0 };
        this.taxRate = 0.10; // 10% VAT
    }

    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                showToast(`Chỉ còn ${product.stock} ${product.unit || 'sản phẩm'} trong kho`, 'error');
                return false;
            }
            existingItem.quantity = newQuantity;
            existingItem.subtotal = existingItem.price * newQuantity;
        } else {
            if (quantity > product.stock) {
                showToast(`Chỉ còn ${product.stock} ${product.unit || 'sản phẩm'} trong kho`, 'error');
                return false;
            }
            this.items.push({
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                quantity: quantity,
                subtotal: product.price * quantity,
                unit: product.unit || '',
                maxStock: product.stock
            });
        }
        
        return true;
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (!item) return false;

        if (quantity <= 0) {
            this.removeItem(productId);
            return true;
        }

        if (quantity > item.maxStock) {
            showToast(`Chỉ còn ${item.maxStock} ${item.unit} trong kho`, 'error');
            return false;
        }

        item.quantity = quantity;
        item.subtotal = item.price * quantity;
        return true;
    }

    clear() {
        this.items = [];
        this.discount = { type: 'amount', value: 0 };
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + item.subtotal, 0);
    }

    getDiscountAmount() {
        const subtotal = this.getSubtotal();
        if (this.discount.type === 'percentage') {
            return Math.min(subtotal * (this.discount.value / 100), subtotal);
        }
        return Math.min(this.discount.value, subtotal);
    }

    getTaxAmount() {
        const afterDiscount = this.getSubtotal() - this.getDiscountAmount();
        return afterDiscount * this.taxRate;
    }

    getTotal() {
        return this.getSubtotal() - this.getDiscountAmount() + this.getTaxAmount();
    }

    applyDiscount(type, value) {
        this.discount = { type, value };
    }

    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    isEmpty() {
        return this.items.length === 0;
    }

    // Generate order data for API
    toOrderData(customerInfo, paymentMethod) {
        return {
            customerName: customerInfo.name || null,
            customerPhone: customerInfo.phone || null,
            items: this.items.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            subtotal: this.getSubtotal(),
            discount: this.getDiscountAmount(),
            tax: this.getTaxAmount(),
            total: this.getTotal(),
            paymentMethod: paymentMethod,
            discountType: this.discount.type,
            discountValue: this.discount.value
        };
    }
}

export default CartManager;
