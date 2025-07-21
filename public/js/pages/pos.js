/**
 * POS (Point of Sale) Page JavaScript
 */

import { requireAuth, getUserData } from '../core/auth.js';
import { showToast, showLoading, hideLoading } from '../core/notifications.js';
import { apiGet, apiPost, API_ENDPOINTS } from '../core/api.js';
import { formatCurrency, debounce } from '../core/utils.js';

class POSPage {
    constructor() {
        this.user = getUserData();
        this.products = [];
        this.categories = [];
        this.cart = [];
        this.currentDiscount = { type: 'amount', value: 0 };
        this.selectedPaymentMethod = 'CASH';
        this.lastOrderId = null;
        
        this.init();
    }

    init() {
        // Protect route
        if (!requireAuth()) {
            return;
        }

        console.log('Initializing POS page...');
        this.bindEvents();
        this.loadData();
    }

    async loadData() {
        console.log('Loading POS data...');
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadProducts()
            ]);
            this.updateCartDisplay();
            console.log('POS data loaded successfully');
        } catch (error) {
            console.error('Failed to load POS data:', error);
            showToast('Không thể tải dữ liệu trang bán hàng', 'error');
        }
    }

    bindEvents() {
        console.log('Binding POS events...');
        
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
            btn.addEventListener('click', this.handlePaymentMethodSelect.bind(this));
        });

        // Checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', this.handleCheckout.bind(this));
        }

        // Modal events
        this.bindModalEvents();

        console.log('POS events bound successfully');
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
        const printReceiptBtn = document.getElementById('print-receipt-btn');
        const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
        const viewOrderBtn = document.getElementById('view-order-btn');

        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', this.startNewOrder.bind(this));
        }
        if (printReceiptFinalBtn) {
            printReceiptFinalBtn.addEventListener('click', this.printReceipt.bind(this));
        }
        if (printReceiptBtn) {
            printReceiptBtn.addEventListener('click', this.printReceipt.bind(this));
        }
        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', this.confirmPayment.bind(this));
        }
        if (viewOrderBtn) {
            viewOrderBtn.addEventListener('click', this.viewOrder.bind(this));
        }
    }

    async loadCategories() {
        try {
            console.log('Loading categories...');
            const response = await apiGet(API_ENDPOINTS.CATEGORIES.LIST);
            console.log('Categories response:', response);
            
            if (response.success && response.data) {
                this.categories = response.data.categories || [];
                this.updateCategoryFilter();
                console.log('Categories loaded:', this.categories.length);
            } else {
                console.error('Invalid categories response:', response);
                this.categories = [];
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categories = [];
            showToast('Không thể tải danh mục sản phẩm', 'error');
        }
    }

    async loadProducts(search = '', categoryId = '') {
        try {
            console.log('Loading products...', { search, categoryId });
            showLoading();
            
            const params = new URLSearchParams({
                limit: '100',
                ...(search && { search }),
                ...(categoryId && { categoryId })
            });

            const response = await apiGet(`${API_ENDPOINTS.PRODUCTS.LIST}?${params}`);
            console.log('Products response:', response);
            
            if (response.success && response.data) {
                this.products = response.data.products || [];
                this.updateProductsGrid();
                console.log('Products loaded:', this.products.length);
            } else {
                console.error('Invalid products response:', response);
                this.products = [];
                this.updateProductsGrid();
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            this.products = [];
            this.updateProductsGrid();
            showToast('Không thể tải danh sách sản phẩm', 'error');
        } finally {
            hideLoading();
        }
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;

        categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>';
        this.categories.forEach(category => {
            categoryFilter.innerHTML += `
                <option value="${category.id}">${category.name}</option>
            `;
        });
    }

    updateProductsGrid() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500">Không tìm thấy sản phẩm nào</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.products.map(product => `
            <div class="product-card ${product.stock <= 0 ? 'out-of-stock' : ''}" 
                 data-product-id="${product.id}">
                <div class="aspect-w-1 aspect-h-1 mb-3">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" class="w-full h-24 object-cover rounded-md">` :
                        `<div class="w-full h-24 bg-gray-200 rounded-md flex items-center justify-center">
                            <i class="fas fa-image text-gray-400 text-2xl"></i>
                         </div>`
                    }
                </div>
                <div class="space-y-1">
                    <h3 class="text-sm font-medium text-gray-900 truncate" title="${product.name}">
                        ${product.name}
                    </h3>
                    <p class="text-xs text-gray-500 truncate">${product.sku}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-semibold text-primary-600">
                            ${formatCurrency(product.price)}
                        </span>
                        <span class="text-xs ${product.stock <= (product.minStock || 5) ? 'text-red-600' : 'text-gray-500'}">
                            ${product.stock} ${product.unit || ''}
                        </span>
                    </div>
                    ${product.stock <= 0 ? 
                        '<div class="text-xs text-red-600 font-medium">Hết hàng</div>' : 
                        product.stock <= (product.minStock || 5) ? 
                        '<div class="text-xs text-orange-600 font-medium">Sắp hết</div>' : ''
                    }
                </div>
            </div>
        `).join('');

        // Bind click events after rendering
        this.bindProductCardEvents();
    }

    bindProductCardEvents() {
        const productCards = document.querySelectorAll('.product-card:not(.out-of-stock)');
        productCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const productId = card.dataset.productId;
                if (productId) {
                    this.addToCart(productId);
                }
            });
            
            // Add cursor pointer style
            card.style.cursor = 'pointer';
        });
        
        // Style out-of-stock cards
        const outOfStockCards = document.querySelectorAll('.product-card.out-of-stock');
        outOfStockCards.forEach(card => {
            card.style.cursor = 'not-allowed';
        });
    }

    addToCart(productId, quantity = 1) {
        console.log('Adding to cart:', productId, quantity);
        console.log('Available products:', this.products.length);
        console.log('Current cart:', this.cart.length);
        
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            console.error('Product not found:', productId);
            console.error('Available product IDs:', this.products.map(p => p.id));
            showToast('Không tìm thấy sản phẩm', 'error');
            return;
        }

        console.log('Found product:', product);

        if (product.stock <= 0) {
            showToast('Sản phẩm này đã hết hàng', 'error');
            return;
        }

        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                showToast(`Chỉ còn ${product.stock} ${product.unit || 'sản phẩm'} trong kho`, 'error');
                return;
            }
            existingItem.quantity = newQuantity;
            existingItem.subtotal = existingItem.price * newQuantity;
            console.log('Updated existing item:', existingItem);
        } else {
            if (quantity > product.stock) {
                showToast(`Chỉ còn ${product.stock} ${product.unit || 'sản phẩm'} trong kho`, 'error');
                return;
            }
            const newItem = {
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                quantity: quantity,
                subtotal: product.price * quantity,
                unit: product.unit || '',
                maxStock: product.stock
            };
            this.cart.push(newItem);
            console.log('Added new item:', newItem);
        }

        this.updateCartDisplay();
        showToast(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
        console.log('Cart updated, total items:', this.cart.length);
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCartDisplay();
    }

    updateCartQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        if (quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        if (quantity > item.maxStock) {
            showToast(`Chỉ còn ${item.maxStock} ${item.unit} trong kho`, 'error');
            return;
        }

        item.quantity = quantity;
        item.subtotal = item.price * quantity;
        this.updateCartDisplay();
    }

    updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCart = document.getElementById('empty-cart');
        const cartItemsCount = document.getElementById('cart-items-count');
        const checkoutBtn = document.getElementById('checkout-btn');

        // Update cart count
        const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
        if (cartItemsCount) {
            cartItemsCount.textContent = totalItems;
        }

        // Enable/disable checkout button
        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0;
        }

        // Show/hide empty state
        if (this.cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartItemsContainer) {
                const emptyDiv = cartItemsContainer.querySelector('.divide-y');
                if (emptyDiv) emptyDiv.innerHTML = '';
            }
        } else {
            if (emptyCart) emptyCart.style.display = 'none';
            this.renderCartItems();
        }

        this.updateOrderSummary();
    }

    renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;

        const itemsHTML = this.cart.map(item => `
            <div class="cart-item p-4 hover:bg-gray-50" data-product-id="${item.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-gray-900">${item.name}</h4>
                        <p class="text-xs text-gray-500">${item.sku}</p>
                        <p class="text-sm text-primary-600">${formatCurrency(item.price)}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button data-action="decrease" data-product-id="${item.id}" data-quantity="${item.quantity - 1}"
                                class="quantity-btn rounded-l-md">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" value="${item.quantity}" min="1" max="${item.maxStock}"
                               data-action="quantity-change" data-product-id="${item.id}"
                               class="quantity-input">
                        <button data-action="increase" data-product-id="${item.id}" data-quantity="${item.quantity + 1}"
                                class="quantity-btn rounded-r-md">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button data-action="remove" data-product-id="${item.id}"
                                class="ml-2 text-red-600 hover:text-red-800">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
                <div class="mt-2 flex justify-between items-center">
                    <span class="text-xs text-gray-500">${item.quantity} × ${formatCurrency(item.price)}</span>
                    <span class="text-sm font-medium">${formatCurrency(item.subtotal)}</span>
                </div>
            </div>
        `).join('');

        cartItemsContainer.innerHTML = `<div class="divide-y divide-gray-200">${itemsHTML}</div>`;
        
        // Bind cart events after rendering
        this.bindCartEvents();
    }

    updateOrderSummary() {
        const subtotal = this.getSubtotal();
        const discountAmount = this.getDiscountAmount();
        const taxAmount = this.getTaxAmount();
        const total = this.getTotal();

        const subtotalEl = document.getElementById('subtotal');
        const discountEl = document.getElementById('discount');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
        if (discountEl) discountEl.textContent = '-' + formatCurrency(discountAmount);
        if (taxEl) taxEl.textContent = formatCurrency(taxAmount);
        if (totalEl) totalEl.textContent = formatCurrency(total);
    }

    getSubtotal() {
        return this.cart.reduce((total, item) => total + item.subtotal, 0);
    }

    getDiscountAmount() {
        const subtotal = this.getSubtotal();
        if (this.currentDiscount.type === 'percentage') {
            return Math.min(subtotal * (this.currentDiscount.value / 100), subtotal);
        }
        return Math.min(this.currentDiscount.value, subtotal);
    }

    getTaxAmount() {
        const afterDiscount = this.getSubtotal() - this.getDiscountAmount();
        return afterDiscount * 0.10; // 10% VAT
    }

    getTotal() {
        return this.getSubtotal() - this.getDiscountAmount() + this.getTaxAmount();
    }

    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
            this.cart = [];
            this.currentDiscount = { type: 'amount', value: 0 };
            this.updateCartDisplay();
            showToast('Đã xóa giỏ hàng', 'success');
        }
    }

    // Event handlers
    handleSearch(event) {
        const search = event.target.value.trim();
        const categoryId = document.getElementById('category-filter')?.value || '';
        this.loadProducts(search, categoryId);
    }

    handleCategoryFilter(event) {
        const categoryId = event.target.value;
        const search = document.getElementById('product-search')?.value.trim() || '';
        this.loadProducts(search, categoryId);
    }

    handlePaymentMethodSelect(event) {
        const method = event.currentTarget.dataset.method;
        if (method) {
            this.selectedPaymentMethod = method;
            
            // Update UI
            document.querySelectorAll('.payment-method-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
        }
    }

    async handleCheckout() {
        if (this.cart.length === 0) {
            showToast('Giỏ hàng trống', 'error');
            return;
        }

        try {
            showLoading();

            const customerName = document.getElementById('customer-name')?.value?.trim() || null;
            const customerPhone = document.getElementById('customer-phone')?.value?.trim() || null;

            // Validate phone number if provided
            if (customerPhone && !this.validatePhoneNumber(customerPhone)) {
                showToast('Số điện thoại không hợp lệ. Vui lòng sử dụng định dạng Việt Nam (VD: 0987654321)', 'error');
                hideLoading();
                return;
            }

            const orderData = {
                customerName,
                customerPhone,
                items: this.cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                subtotal: this.getSubtotal(),
                discount: this.getDiscountAmount(),
                tax: this.getTaxAmount(),
                total: this.getTotal(),
                paymentMethod: this.selectedPaymentMethod,
                discountType: this.currentDiscount.type,
                discountValue: this.currentDiscount.value
            };

            console.log('Checkout data:', orderData);

            const response = await apiPost(API_ENDPOINTS.ORDERS.CREATE, orderData);
            console.log('Checkout response:', response);

            if (response.success) {
                this.lastOrderId = response.data.order.id;
                this.showPaymentSuccess(response.data.order);
                showToast('Thanh toán thành công!', 'success');
                
                // Refresh dashboard stats after successful order
                if (typeof window.refreshDashboard === 'function') {
                    window.refreshDashboard();
                }
            } else {
                showToast(response.message || 'Thanh toán thất bại', 'error');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showToast('Lỗi thanh toán: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            hideLoading();
        }
    }

    validatePhoneNumber(phone) {
        if (!phone) return true; // Optional field
        
        // Vietnamese phone number pattern
        const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    showPaymentSuccess(order) {
        const modal = document.getElementById('payment-modal');
        const orderNumber = document.getElementById('order-number');
        const paymentTotal = document.getElementById('payment-total');
        const paymentMethodText = document.getElementById('payment-method-text');
        const orderStatusBadge = document.getElementById('order-status-badge');
        const pendingActions = document.getElementById('pending-payment-actions');
        const completedActions = document.getElementById('completed-payment-actions');

        if (modal && orderNumber && paymentTotal && paymentMethodText) {
            // Store current order for later use
            this.currentOrder = order;
            
            orderNumber.textContent = `#${order.id}`;
            paymentTotal.textContent = formatCurrency(order.total);
            paymentMethodText.textContent = this.getPaymentMethodName(this.selectedPaymentMethod);
            
            // Set order status
            this.updateOrderStatusDisplay(order.status || 'PENDING');
            
            // Show appropriate actions based on order status
            if (order.status === 'COMPLETED') {
                if (pendingActions) pendingActions.style.display = 'none';
                if (completedActions) completedActions.style.display = 'block';
            } else {
                if (pendingActions) pendingActions.style.display = 'block';
                if (completedActions) completedActions.style.display = 'none';
            }
            
            modal.classList.remove('hidden');
        }
    }

    updateOrderStatusDisplay(status) {
        const orderStatusBadge = document.getElementById('order-status-badge');
        if (!orderStatusBadge) return;

        // Remove existing status classes
        orderStatusBadge.className = orderStatusBadge.className.replace(/status-\w+/g, '');
        
        let statusText = '';
        let statusClass = '';
        let statusIcon = '';

        switch (status) {
            case 'PENDING':
                statusText = 'Chờ thanh toán';
                statusClass = 'status-pending';
                statusIcon = 'fas fa-clock';
                break;
            case 'PROCESSING':
                statusText = 'Đang xử lý';
                statusClass = 'status-processing';
                statusIcon = 'fas fa-spinner fa-spin';
                break;
            case 'COMPLETED':
                statusText = 'Đã thanh toán';
                statusClass = 'status-completed';
                statusIcon = 'fas fa-check-circle';
                break;
            case 'CANCELLED':
                statusText = 'Đã hủy';
                statusClass = 'status-cancelled';
                statusIcon = 'fas fa-times-circle';
                break;
            default:
                statusText = status;
                statusClass = 'status-pending';
                statusIcon = 'fas fa-question-circle';
        }

        orderStatusBadge.className += ` ${statusClass}`;
        orderStatusBadge.innerHTML = `<i class="${statusIcon} mr-1"></i>${statusText}`;
    }

    getPaymentMethodName(method) {
        const methods = {
            'CASH': 'Tiền mặt',
            'CARD': 'Thẻ',
            'BANK_TRANSFER': 'Chuyển khoản',
            'E_WALLET': 'Ví điện tử'
        };
        return methods[method] || method;
    }

    startNewOrder() {
        this.cart = [];
        this.currentDiscount = { type: 'amount', value: 0 };
        this.selectedPaymentMethod = 'CASH';
        
        // Reset customer info
        const customerName = document.getElementById('customer-name');
        const customerPhone = document.getElementById('customer-phone');
        if (customerName) customerName.value = '';
        if (customerPhone) customerPhone.value = '';
        
        // Reset payment method UI
        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.method === 'CASH') {
                btn.classList.add('active');
            }
        });
        
        this.updateCartDisplay();
        this.hideModal('payment-modal');
        showToast('Đã tạo đơn hàng mới', 'success');
    }

    // Modal helpers
    showCustomItemModal() {
        this.showModal('custom-item-modal');
    }

    showDiscountModal() {
        this.showModal('discount-modal');
    }

    handleCustomItemSubmit(event) {
        event.preventDefault();
        
        const name = document.getElementById('custom-item-name')?.value.trim();
        const price = parseFloat(document.getElementById('custom-item-price')?.value) || 0;
        const quantity = parseInt(document.getElementById('custom-item-quantity')?.value) || 1;

        if (!name || price <= 0) {
            showToast('Vui lòng nhập đầy đủ thông tin', 'error');
            return;
        }

        // Create custom product
        const customProduct = {
            id: 'custom-' + Date.now(),
            name: name,
            sku: 'CUSTOM',
            price: price,
            stock: 9999, // Unlimited stock for custom items
            unit: ''
        };

        // Add to products list and cart
        this.products.push(customProduct);
        this.addToCart(customProduct.id, quantity);
        
        this.hideModal('custom-item-modal');
        event.target.reset();
    }

    handleDiscountSubmit(event) {
        event.preventDefault();
        
        const type = document.getElementById('discount-type')?.value || 'amount';
        const value = parseFloat(document.getElementById('discount-value')?.value) || 0;

        if (value <= 0) {
            showToast('Giá trị giảm giá phải lớn hơn 0', 'error');
            return;
        }

        this.currentDiscount = { type, value };
        this.updateOrderSummary();
        this.hideModal('discount-modal');
        
        showToast('Đã áp dụng giảm giá', 'success');
    }

    handleDiscountTypeChange(event) {
        const type = event.target.value;
        const unit = document.getElementById('discount-unit');
        if (unit) {
            unit.textContent = type === 'percentage' ? '%' : '₫';
        }
    }

    handleBarcodeClick() {
        const barcode = prompt('Nhập mã vạch sản phẩm:');
        if (barcode) {
            const product = this.products.find(p => p.barcode === barcode);
            if (product) {
                this.addToCart(product.id);
            } else {
                showToast('Không tìm thấy sản phẩm với mã vạch này', 'error');
            }
        }
    }

    printReceipt() {
        showToast('Chức năng in hóa đơn đang được phát triển', 'info');
    }

    viewOrder() {
        if (this.lastOrderId) {
            window.location.href = `/orders/${this.lastOrderId}`;
        }
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

    bindCartEvents() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;

        // Remove existing event listeners
        cartItemsContainer.removeEventListener('click', this.handleCartClick);
        cartItemsContainer.removeEventListener('change', this.handleCartChange);

        // Add event delegation for cart interactions
        this.handleCartClick = (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            e.preventDefault();
            e.stopPropagation();

            const action = button.dataset.action;
            const productId = button.dataset.productId;
            const quantity = parseInt(button.dataset.quantity);

            switch (action) {
                case 'decrease':
                    if (quantity > 0) {
                        this.updateCartQuantity(productId, quantity);
                    }
                    break;
                case 'increase':
                    this.updateCartQuantity(productId, quantity);
                    break;
                case 'remove':
                    this.removeFromCart(productId);
                    break;
            }
        };

        this.handleCartChange = (e) => {
            const input = e.target.closest('input[data-action="quantity-change"]');
            if (!input) return;

            const productId = input.dataset.productId;
            const quantity = parseInt(input.value) || 1;
            this.updateCartQuantity(productId, quantity);
        };

        cartItemsContainer.addEventListener('click', this.handleCartClick);
        cartItemsContainer.addEventListener('change', this.handleCartChange);
    }

    async confirmPayment() {
        if (!this.currentOrder) {
            showToast('Không tìm thấy thông tin đơn hàng', 'error');
            return;
        }

        try {
            showLoading();

            console.log('Confirming payment for order:', this.currentOrder.id);

            // Call API to update order status to COMPLETED
            const response = await apiPost(API_ENDPOINTS.ORDERS.UPDATE_STATUS(this.currentOrder.id), {
                status: 'COMPLETED'
            });

            console.log('Payment confirmation response:', response);

            if (response.success) {
                // Update current order status
                this.currentOrder.status = 'COMPLETED';
                
                // Update UI
                this.updateOrderStatusDisplay('COMPLETED');
                
                // Switch action buttons
                const pendingActions = document.getElementById('pending-payment-actions');
                const completedActions = document.getElementById('completed-payment-actions');
                
                if (pendingActions) pendingActions.style.display = 'none';
                if (completedActions) completedActions.style.display = 'block';
                
                showToast('Đã xác nhận thanh toán thành công!', 'success');
                
                // Refresh dashboard stats after payment confirmation
                if (typeof window.refreshDashboard === 'function') {
                    window.refreshDashboard();
                }
            } else {
                showToast(response.message || 'Không thể xác nhận thanh toán', 'error');
            }
        } catch (error) {
            console.error('Payment confirmation error:', error);
            showToast('Lỗi xác nhận thanh toán: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            hideLoading();
        }
    }
}

// Initialize POS page
let posPage;
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing POS page...');
    posPage = new POSPage();
    
    // Make it globally accessible for onclick handlers
    window.posPage = posPage;
});

export default POSPage;
