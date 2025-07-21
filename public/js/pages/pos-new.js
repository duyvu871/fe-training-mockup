/**
 * POS (Point of Sale) Page JavaScript
 */

import { requireAuth, getUserData } from '../core/auth.js';
import { showToast, showLoading, hideLoading } from '../core/notifications.js';
import { apiGet, apiPost, API_ENDPOINTS } from '../core/api.js';
import { formatCurrency, debounce } from '../core/utils.js';
import CartManager from '../pos/cart.js';
import ProductsManager from '../pos/products.js';
import PaymentManager from '../pos/payment.js';

class POSPage {
    constructor() {
        this.user = getUserData();
        this.cartManager = new CartManager();
        this.productsManager = new ProductsManager();
        this.paymentManager = new PaymentManager();
        this.lastOrderId = null;
        
        this.init();
    }

    init() {
        // Protect route
        if (!requireAuth()) {
            return;
        }

        this.bindEvents();
        this.loadData();
        this.updateCartDisplay();
    }

    async loadData() {
        await Promise.all([
            this.productsManager.loadCategories(),
            this.productsManager.loadProducts()
        ]);
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(this.handleSearch.bind(this), 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', this.handleCategoryFilter.bind(this));
        }

        // Barcode scan
        const barcodeScanBtn = document.getElementById('barcode-scan-btn');
        if (barcodeScanBtn) {
            barcodeScanBtn.addEventListener('click', this.handleBarcodeClick.bind(this));
        }

        // Cart actions
        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', this.clearCart.bind(this));
        }

        // Custom item
        const addCustomItemBtn = document.getElementById('add-custom-item-btn');
        if (addCustomItemBtn) {
            addCustomItemBtn.addEventListener('click', this.showCustomItemModal.bind(this));
        }

        // Discount
        const applyDiscountBtn = document.getElementById('apply-discount-btn');
        if (applyDiscountBtn) {
            applyDiscountBtn.addEventListener('click', this.showDiscountModal.bind(this));
        }

        // Payment methods
        const paymentBtns = document.querySelectorAll('.payment-method-btn');
        paymentBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.currentTarget.dataset.method;
                this.paymentManager.setPaymentMethod(method);
            });
        });

        // Checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', this.handleCheckout.bind(this));
        }

        // Modal events
        this.bindModalEvents();

        // Keyboard shortcuts
        this.bindKeyboardShortcuts();
    }

    handleSearch(e) {
        const searchTerm = e.target.value.trim();
        this.productsManager.setSearch(searchTerm);
    }

    handleCategoryFilter(e) {
        const categoryId = e.target.value;
        this.productsManager.setCategory(categoryId);
    }

    addToCart(productId, quantity = 1) {
        const product = this.productsManager.findById(productId);
        if (!product) return;

        if (product.stock <= 0) {
            showToast('Sản phẩm này đã hết hàng', 'error');
            return;
        }

        if (this.cartManager.addItem(product, quantity)) {
            this.updateCartDisplay();
            showToast(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
        }
    }

    removeFromCart(productId) {
        this.cartManager.removeItem(productId);
        this.updateCartDisplay();
        showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
    }

    updateCartQuantity(productId, quantity) {
        if (this.cartManager.updateQuantity(productId, quantity)) {
            this.updateCartDisplay();
        }
    }

    clearCart() {
        if (this.cartManager.isEmpty()) {
            showToast('Giỏ hàng đã trống', 'info');
            return;
        }

        if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
            this.cartManager.clear();
            this.updateCartDisplay();
            showToast('Đã xóa tất cả sản phẩm', 'success');
        }
    }

    updateCartDisplay() {
        this.updateCartItems();
        this.updateCartSummary();
        this.updateCheckoutButton();
    }

    updateCartItems() {
        const cartContainer = document.getElementById('cart-items');
        const emptyCart = document.getElementById('empty-cart');
        const cartItemsCount = document.getElementById('cart-items-count');
        
        if (!cartContainer) return;

        const items = this.cartManager.items;
        
        // Update items count
        if (cartItemsCount) {
            cartItemsCount.textContent = this.cartManager.getItemCount();
        }

        if (items.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            cartContainer.innerHTML = '';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        
        cartContainer.innerHTML = items.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-medium text-gray-900 truncate">${item.name}</h4>
                        <p class="text-xs text-gray-500">${item.sku}</p>
                        <p class="text-sm font-semibold text-primary-600">${formatCurrency(item.price)}</p>
                    </div>
                    <button onclick="posPage.removeFromCart('${item.id}')" class="ml-2 text-red-600 hover:text-red-800">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
                <div class="mt-2 flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <button onclick="posPage.updateCartQuantity('${item.id}', ${item.quantity - 1})" 
                                class="quantity-btn rounded-l-md ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" value="${item.quantity}" min="1" max="${item.maxStock}"
                               onchange="posPage.updateCartQuantity('${item.id}', parseInt(this.value))"
                               class="quantity-input">
                        <button onclick="posPage.updateCartQuantity('${item.id}', ${item.quantity + 1})" 
                                class="quantity-btn rounded-r-md ${item.quantity >= item.maxStock ? 'opacity-50 cursor-not-allowed' : ''}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="text-sm font-semibold">
                        ${formatCurrency(item.subtotal)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateCartSummary() {
        const subtotalEl = document.getElementById('subtotal');
        const discountEl = document.getElementById('discount');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');

        const subtotal = this.cartManager.getSubtotal();
        const discountAmount = this.cartManager.getDiscountAmount();
        const taxAmount = this.cartManager.getTaxAmount();
        const total = this.cartManager.getTotal();

        if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
        if (discountEl) discountEl.textContent = `-${formatCurrency(discountAmount)}`;
        if (taxEl) taxEl.textContent = formatCurrency(taxAmount);
        if (totalEl) totalEl.textContent = formatCurrency(total);
    }

    updateCheckoutButton() {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.cartManager.isEmpty();
        }
    }

    async handleCheckout() {
        if (this.cartManager.isEmpty()) {
            showToast('Giỏ hàng trống', 'error');
            return;
        }

        // Get customer info
        const customerName = document.getElementById('customer-name')?.value || null;
        const customerPhone = document.getElementById('customer-phone')?.value || null;

        // Prepare order data
        const orderData = this.cartManager.toOrderData(
            { name: customerName, phone: customerPhone },
            this.paymentManager.getSelectedMethod()
        );

        // Process payment
        const success = await this.paymentManager.processPayment(orderData);
        
        if (success) {
            // Store last order info
            const transaction = this.paymentManager.getLastTransaction();
            if (transaction) {
                this.lastOrderId = transaction.orderId;
            }
            
            // Clear cart
            this.cartManager.clear();
            this.updateCartDisplay();
            
            // Clear customer info
            if (document.getElementById('customer-name')) {
                document.getElementById('customer-name').value = '';
            }
            if (document.getElementById('customer-phone')) {
                document.getElementById('customer-phone').value = '';
            }
        }
    }

    startNewOrder() {
        this.paymentManager.hidePaymentModal();
        this.cartManager.clear();
        this.updateCartDisplay();
        
        // Clear customer info
        if (document.getElementById('customer-name')) {
            document.getElementById('customer-name').value = '';
        }
        if (document.getElementById('customer-phone')) {
            document.getElementById('customer-phone').value = '';
        }
        
        // Focus search
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.focus();
        }
    }

    // Custom item modal
    showCustomItemModal() {
        this.showModal('custom-item-modal');
        const nameInput = document.getElementById('custom-item-name');
        if (nameInput) nameInput.focus();
    }

    handleCustomItemSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('custom-item-name')?.value;
        const price = parseFloat(document.getElementById('custom-item-price')?.value);
        const quantity = parseInt(document.getElementById('custom-item-quantity')?.value);

        if (!name || !price || !quantity) {
            showToast('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        // Create custom product object
        const customProduct = {
            id: `custom-${Date.now()}`,
            name: name,
            sku: 'CUSTOM',
            price: price,
            stock: 999, // Unlimited for custom items
            unit: 'cái'
        };

        if (this.cartManager.addItem(customProduct, quantity)) {
            this.updateCartDisplay();
            this.hideModal('custom-item-modal');
            
            // Reset form
            document.getElementById('custom-item-form').reset();
            showToast(`Đã thêm ${name} vào giỏ hàng`, 'success');
        }
    }

    // Discount modal
    showDiscountModal() {
        this.showModal('discount-modal');
        const valueInput = document.getElementById('discount-value');
        if (valueInput) valueInput.focus();
    }

    handleDiscountTypeChange(e) {
        const type = e.target.value;
        const unitEl = document.getElementById('discount-unit');
        if (unitEl) {
            unitEl.textContent = type === 'percentage' ? '%' : '₫';
        }
    }

    handleDiscountSubmit(e) {
        e.preventDefault();
        
        const type = document.getElementById('discount-type')?.value;
        const value = parseFloat(document.getElementById('discount-value')?.value);

        if (!value || value <= 0) {
            showToast('Giá trị giảm giá không hợp lệ', 'error');
            return;
        }

        if (type === 'percentage' && value > 100) {
            showToast('Phần trăm giảm giá không thể vượt quá 100%', 'error');
            return;
        }

        this.cartManager.applyDiscount(type, value);
        this.updateCartDisplay();
        this.hideModal('discount-modal');
        
        // Reset form
        document.getElementById('discount-form').reset();
        showToast('Đã áp dụng giảm giá', 'success');
    }

    handleBarcodeClick() {
        const barcode = prompt('Nhập mã vạch sản phẩm:');
        if (barcode) {
            const product = this.productsManager.findByBarcode(barcode);
            if (product) {
                this.addToCart(product.id);
            } else {
                showToast('Không tìm thấy sản phẩm với mã vạch này', 'error');
            }
        }
    }

    printReceipt() {
        this.paymentManager.printReceipt();
    }

    viewOrder() {
        if (this.lastOrderId) {
            window.location.href = `/orders/${this.lastOrderId}`;
        }
    }

    bindModalEvents() {
        // Custom item modal
        const customItemForm = document.getElementById('custom-item-form');
        const cancelCustomItemBtn = document.getElementById('cancel-custom-item-btn');

        if (customItemForm) {
            customItemForm.addEventListener('submit', this.handleCustomItemSubmit.bind(this));
        }
        if (cancelCustomItemBtn) {
            cancelCustomItemBtn.addEventListener('click', () => this.hideModal('custom-item-modal'));
        }

        // Discount modal
        const discountForm = document.getElementById('discount-form');
        const discountType = document.getElementById('discount-type');
        const cancelDiscountBtn = document.getElementById('cancel-discount-btn');

        if (discountForm) {
            discountForm.addEventListener('submit', this.handleDiscountSubmit.bind(this));
        }
        if (discountType) {
            discountType.addEventListener('change', this.handleDiscountTypeChange.bind(this));
        }
        if (cancelDiscountBtn) {
            cancelDiscountBtn.addEventListener('click', () => this.hideModal('discount-modal'));
        }

        // Payment modal
        const newOrderBtn = document.getElementById('new-order-btn');
        const printReceiptFinalBtn = document.getElementById('print-receipt-final-btn');
        const viewOrderBtn = document.getElementById('view-order-btn');

        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', this.startNewOrder.bind(this));
        }
        if (printReceiptFinalBtn) {
            printReceiptFinalBtn.addEventListener('click', this.printReceipt.bind(this));
        }
        if (viewOrderBtn) {
            viewOrderBtn.addEventListener('click', this.viewOrder.bind(this));
        }

        // Close modals on backdrop click
        document.querySelectorAll('[id$="-modal"]').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F1: Focus search
            if (e.key === 'F1') {
                e.preventDefault();
                document.getElementById('product-search')?.focus();
            }
            // F2: Add custom item
            if (e.key === 'F2') {
                e.preventDefault();
                this.showCustomItemModal();
            }
            // F3: Apply discount
            if (e.key === 'F3') {
                e.preventDefault();
                this.showDiscountModal();
            }
            // F4: Checkout
            if (e.key === 'F4') {
                e.preventDefault();
                if (!document.getElementById('checkout-btn').disabled) {
                    this.handleCheckout();
                }
            }
            // Escape: Close modals
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
            // Arrow keys for product navigation
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.productsManager.selectProduct(e.key === 'ArrowDown' ? 'next' : 'prev');
            }
            // Enter: Add selected product
            if (e.key === 'Enter' && e.target.id === 'product-search') {
                e.preventDefault();
                this.productsManager.addSelectedProduct();
            }
        });
    }

    clearFilters() {
        const searchInput = document.getElementById('product-search');
        const categoryFilter = document.getElementById('category-filter');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        
        this.productsManager.setSearch('');
        this.productsManager.setCategory('');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    hideAllModals() {
        document.querySelectorAll('[id$="-modal"]').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
}

// Initialize POS page
let posPage;
document.addEventListener('DOMContentLoaded', function() {
    posPage = new POSPage();
    
    // Make it globally accessible for onclick handlers
    window.posPage = posPage;
});

export default POSPage;
