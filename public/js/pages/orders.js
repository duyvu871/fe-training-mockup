/**
 * Orders Page JavaScript
 */

import { requireAuth, getUserData, isAdmin } from '../core/auth.js';
import { showToast, showLoading, hideLoading } from '../core/notifications.js';
import { apiGet, apiPut, API_ENDPOINTS } from '../core/api.js';

class OrdersPage {
    constructor() {
        this.user = getUserData();
        this.orders = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentSort = { field: 'createdAt', order: 'desc' };
        this.filters = {};
        this.selectedOrder = null;
        
        this.init();
    }

    init() {
        // Protect route
        if (!requireAuth()) {
            return;
        }

        this.bindEvents();
        this.loadOrders();
        this.loadOrderStats();
    }

    bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadOrders();
                this.loadOrderStats();
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.exportOrders.bind(this));
        }

        // Page size change
        const pageSizeSelect = document.getElementById('page-size');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.pageSize = parseInt(e.target.value);
                this.currentPage = 1;
                this.loadOrders();
            });
        }

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = e.target.value.trim();
                    this.currentPage = 1;
                    this.loadOrders();
                }, 500);
            });
        }

        // Apply filters button
        const applyFiltersBtn = document.getElementById('apply-filters-btn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', this.clearFilters.bind(this));
        }

        // Table sorting
        const sortHeaders = document.querySelectorAll('th[data-sort]');
        sortHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                if (this.currentSort.field === field) {
                    this.currentSort.order = this.currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    this.currentSort.field = field;
                    this.currentSort.order = 'desc';
                }
                this.updateSortIndicators();
                this.loadOrders();
            });
        });

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Order detail modal
        const closeOrderDetailModal = document.getElementById('close-order-detail-modal');
        if (closeOrderDetailModal) {
            closeOrderDetailModal.addEventListener('click', this.hideOrderDetailModal.bind(this));
        }

        // Update status modal
        const closeUpdateStatusModal = document.getElementById('close-update-status-modal');
        if (closeUpdateStatusModal) {
            closeUpdateStatusModal.addEventListener('click', this.hideUpdateStatusModal.bind(this));
        }

        const cancelUpdateStatus = document.getElementById('cancel-update-status');
        if (cancelUpdateStatus) {
            cancelUpdateStatus.addEventListener('click', this.hideUpdateStatusModal.bind(this));
        }

        const saveStatusBtn = document.getElementById('save-status-btn');
        if (saveStatusBtn) {
            saveStatusBtn.addEventListener('click', this.saveOrderStatus.bind(this));
        }

        // Update status button from order detail modal
        const updateStatusBtn = document.getElementById('update-status-btn');
        if (updateStatusBtn) {
            updateStatusBtn.addEventListener('click', () => {
                this.hideOrderDetailModal();
                this.showUpdateStatusModal();
            });
        }

        // Print receipt button
        const printReceiptBtn = document.getElementById('print-receipt-btn');
        if (printReceiptBtn) {
            printReceiptBtn.addEventListener('click', this.printReceipt.bind(this));
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            const orderDetailModal = document.getElementById('order-detail-modal');
            const updateStatusModal = document.getElementById('update-status-modal');
            
            if (e.target === orderDetailModal) {
                this.hideOrderDetailModal();
            }
            if (e.target === updateStatusModal) {
                this.hideUpdateStatusModal();
            }
        });
    }

    async loadOrders() {
        try {
            showLoading('Đang tải danh sách đơn hàng...');

            const params = new URLSearchParams({
                page: this.currentPage.toString(),
                limit: this.pageSize.toString(),
                sortBy: this.currentSort.field,
                sortOrder: this.currentSort.order
            });

            // Add filters
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const response = await apiGet(`${API_ENDPOINTS.ORDERS.LIST}?${params.toString()}`);
            
            if (response.success) {
                this.orders = response.data.orders || [];
                this.totalItems = response.data.total || 0;
                this.totalPages = response.data.totalPages || 0;
                this.currentPage = response.data.page || 1;

                this.renderOrdersTable();
                this.renderPagination();
                this.updateOrdersCount();
            } else {
                throw new Error(response.message || 'Không thể tải danh sách đơn hàng');
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
            showToast('Lỗi khi tải danh sách đơn hàng: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    async loadOrderStats() {
        try {
            const response = await apiGet(API_ENDPOINTS.ORDERS.STATS || '/orders/stats');
            
            if (response.success) {
                const stats = response.data.stats;
                this.updateStats(stats);
            }
        } catch (error) {
            console.error('Failed to load order stats:', error);
        }
    }

    updateStats(stats) {
        const elements = {
            'total-orders-stat': stats.total || 0,
            'pending-orders-stat': stats.byStatus?.PENDING || 0,
            'completed-orders-stat': stats.byStatus?.COMPLETED || 0,
            'total-revenue-stat': this.formatCurrency(stats.totalRevenue || 0)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    renderOrdersTable() {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;

        if (this.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-2"></i>
                            <p>Không có đơn hàng nào</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.orders.map(order => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div class="flex items-center">
                        <span class="text-primary-600 cursor-pointer hover:text-primary-800" onclick="window.ordersPage.viewOrderDetail('${order.id}')">
                            #${order.orderNumber || order.id.slice(-8)}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                        <div class="font-medium">${order.customerName || 'Khách lẻ'}</div>
                        ${order.customerPhone ? `<div class="text-gray-500">${order.customerPhone}</div>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div class="font-medium">${this.formatCurrency(order.total)}</div>
                    ${order.discount > 0 ? `<div class="text-xs text-gray-500">Giảm giá: ${this.formatCurrency(order.discount)}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getPaymentMethodBadgeClass(order.paymentMethod)}">
                        ${this.getPaymentMethodText(order.paymentMethod)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusBadgeClass(order.status)}">
                        ${this.getStatusText(order.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>${this.formatDate(order.createdAt)}</div>
                    <div class="text-xs">${this.formatTime(order.createdAt)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        <button onclick="window.ordersPage.viewOrderDetail('${order.id}')" class="text-primary-600 hover:text-primary-900" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${isAdmin() || order.status === 'PENDING' ? `
                            <button onclick="window.ordersPage.editOrderStatus('${order.id}')" class="text-blue-600 hover:text-blue-900" title="Cập nhật trạng thái">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        <button onclick="window.ordersPage.printOrderReceipt('${order.id}')" class="text-green-600 hover:text-green-900" title="In hóa đơn">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const paginationNav = document.getElementById('pagination-nav');
        if (!paginationNav) return;

        if (this.totalPages <= 1) {
            paginationNav.innerHTML = '';
            return;
        }

        const maxVisiblePages = 5;
        const startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.ordersPage.goToPage(${this.currentPage - 1})"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let page = startPage; page <= endPage; page++) {
            const isCurrentPage = page === this.currentPage;
            paginationHTML += `
                <button onclick="window.ordersPage.goToPage(${page})"
                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrentPage 
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600' 
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }">
                    ${page}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="window.ordersPage.goToPage(${this.currentPage + 1})"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationNav.innerHTML = paginationHTML;

        // Update showing info
        const showingFrom = (this.currentPage - 1) * this.pageSize + 1;
        const showingTo = Math.min(this.currentPage * this.pageSize, this.totalItems);

        document.getElementById('showing-from').textContent = showingFrom;
        document.getElementById('showing-to').textContent = showingTo;
        document.getElementById('total-items').textContent = this.totalItems;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadOrders();
        }
    }

    updateSortIndicators() {
        // Remove all sort indicators
        document.querySelectorAll('th[data-sort] i').forEach(icon => {
            icon.className = 'fas fa-sort ml-1';
        });

        // Add current sort indicator
        const currentHeader = document.querySelector(`th[data-sort="${this.currentSort.field}"] i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this.currentSort.order === 'asc' ? 'up' : 'down'} ml-1`;
        }
    }

    updateOrdersCount() {
        const countElements = document.querySelectorAll('[id$="-stat"]');
        // Update based on current filtered results if needed
    }

    applyFilters() {
        this.filters = {
            status: document.getElementById('status-filter')?.value || '',
            paymentMethod: document.getElementById('payment-filter')?.value || '',
            dateFrom: document.getElementById('date-from')?.value || '',
            dateTo: document.getElementById('date-to')?.value || '',
            customerName: document.getElementById('search-input')?.value?.trim() || ''
        };

        this.currentPage = 1;
        this.loadOrders();
    }

    clearFilters() {
        // Clear form inputs
        document.getElementById('status-filter').value = '';
        document.getElementById('payment-filter').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        document.getElementById('search-input').value = '';

        // Clear internal filters
        this.filters = {};
        this.currentPage = 1;
        this.loadOrders();
    }

    async viewOrderDetail(orderId) {
        try {
            showLoading('Đang tải chi tiết đơn hàng...');

            const response = await apiGet(API_ENDPOINTS.ORDERS.GET(orderId));
            
            if (response.success) {
                this.selectedOrder = response.data.order;
                this.showOrderDetailModal();
            } else {
                throw new Error(response.message || 'Không thể tải chi tiết đơn hàng');
            }
        } catch (error) {
            console.error('Failed to load order detail:', error);
            showToast('Lỗi khi tải chi tiết đơn hàng: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    showOrderDetailModal() {
        if (!this.selectedOrder) return;

        const modal = document.getElementById('order-detail-modal');
        const title = document.getElementById('order-detail-title');
        const content = document.getElementById('order-detail-content');

        title.textContent = `Chi tiết đơn hàng #${this.selectedOrder.orderNumber || this.selectedOrder.id.slice(-8)}`;
        
        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Order Info -->
                <div>
                    <h4 class="text-lg font-medium text-gray-900 mb-4">Thông tin đơn hàng</h4>
                    <dl class="space-y-2">
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Mã đơn hàng:</dt>
                            <dd class="text-sm font-medium text-gray-900">#${this.selectedOrder.orderNumber || this.selectedOrder.id.slice(-8)}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Trạng thái:</dt>
                            <dd><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusBadgeClass(this.selectedOrder.status)}">${this.getStatusText(this.selectedOrder.status)}</span></dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Phương thức thanh toán:</dt>
                            <dd><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getPaymentMethodBadgeClass(this.selectedOrder.paymentMethod)}">${this.getPaymentMethodText(this.selectedOrder.paymentMethod)}</span></dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Ngày tạo:</dt>
                            <dd class="text-sm text-gray-900">${this.formatDateTime(this.selectedOrder.createdAt)}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Người tạo:</dt>
                            <dd class="text-sm text-gray-900">${this.selectedOrder.createdBy?.username || 'N/A'}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Customer Info -->
                <div>
                    <h4 class="text-lg font-medium text-gray-900 mb-4">Thông tin khách hàng</h4>
                    <dl class="space-y-2">
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Tên khách hàng:</dt>
                            <dd class="text-sm font-medium text-gray-900">${this.selectedOrder.customerName || 'Khách lẻ'}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Số điện thoại:</dt>
                            <dd class="text-sm text-gray-900">${this.selectedOrder.customerPhone || 'N/A'}</dd>
                        </div>
                        ${this.selectedOrder.notes ? `
                            <div>
                                <dt class="text-sm text-gray-600 mb-1">Ghi chú:</dt>
                                <dd class="text-sm text-gray-900">${this.selectedOrder.notes}</dd>
                            </div>
                        ` : ''}
                    </dl>
                </div>
            </div>

            <!-- Order Items -->
            <div class="mt-6">
                <h4 class="text-lg font-medium text-gray-900 mb-4">Sản phẩm</h4>
                <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table class="min-w-full divide-y divide-gray-300">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${(this.selectedOrder.orderItems || []).map(item => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div class="font-medium">${item.product?.name || 'Sản phẩm không xác định'}</div>
                                        <div class="text-gray-500">${item.product?.sku || ''}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatCurrency(item.price)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatCurrency(item.subtotal)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Order Summary -->
                <div class="mt-6 bg-gray-50 rounded-lg p-4">
                    <dl class="space-y-2">
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Tạm tính:</dt>
                            <dd class="text-sm text-gray-900">${this.formatCurrency(this.selectedOrder.subtotal)}</dd>
                        </div>
                        ${this.selectedOrder.discount > 0 ? `
                            <div class="flex justify-between">
                                <dt class="text-sm text-gray-600">Giảm giá:</dt>
                                <dd class="text-sm text-red-600">-${this.formatCurrency(this.selectedOrder.discount)}</dd>
                            </div>
                        ` : ''}
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-600">Thuế:</dt>
                            <dd class="text-sm text-gray-900">${this.formatCurrency(this.selectedOrder.tax)}</dd>
                        </div>
                        <div class="flex justify-between border-t pt-2">
                            <dt class="text-base font-medium text-gray-900">Tổng cộng:</dt>
                            <dd class="text-base font-bold text-gray-900">${this.formatCurrency(this.selectedOrder.total)}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    hideOrderDetailModal() {
        const modal = document.getElementById('order-detail-modal');
        modal.classList.add('hidden');
        this.selectedOrder = null;
    }

    editOrderStatus(orderId) {
        this.selectedOrder = this.orders.find(order => order.id === orderId);
        if (this.selectedOrder) {
            this.showUpdateStatusModal();
        }
    }

    showUpdateStatusModal() {
        if (!this.selectedOrder) return;

        const modal = document.getElementById('update-status-modal');
        const statusSelect = document.getElementById('new-status');
        
        // Set current status as selected
        statusSelect.value = this.selectedOrder.status;
        
        modal.classList.remove('hidden');
    }

    hideUpdateStatusModal() {
        const modal = document.getElementById('update-status-modal');
        modal.classList.add('hidden');
        
        // Reset form
        document.getElementById('update-status-form').reset();
    }

    async saveOrderStatus() {
        if (!this.selectedOrder) return;

        try {
            const newStatus = document.getElementById('new-status').value;
            const note = document.getElementById('status-note').value.trim();

            if (!newStatus) {
                showToast('Vui lòng chọn trạng thái mới', 'error');
                return;
            }

            if (newStatus === this.selectedOrder.status) {
                showToast('Trạng thái mới phải khác trạng thái hiện tại', 'error');
                return;
            }

            showLoading('Đang cập nhật trạng thái đơn hàng...');

            const response = await apiPut(API_ENDPOINTS.ORDERS.UPDATE_STATUS(this.selectedOrder.id), {
                status: newStatus,
                note: note
            });

            if (response.success) {
                showToast('Cập nhật trạng thái đơn hàng thành công', 'success');
                this.hideUpdateStatusModal();
                await this.loadOrders(); // Reload orders
                await this.loadOrderStats(); // Reload stats
                
                // Refresh dashboard if function exists
                if (typeof window.refreshDashboard === 'function') {
                    window.refreshDashboard();
                }
            } else {
                throw new Error(response.message || 'Không thể cập nhật trạng thái đơn hàng');
            }
        } catch (error) {
            console.error('Failed to update order status:', error);
            showToast('Lỗi khi cập nhật trạng thái đơn hàng: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    async printOrderReceipt(orderId) {
        try {
            showLoading('Đang tạo hóa đơn...');
            
            // For now, just print the current order detail modal content
            // In a real implementation, you might want to open a new window with formatted receipt
            const order = this.orders.find(o => o.id === orderId);
            if (!order) {
                throw new Error('Không tìm thấy đơn hàng');
            }

            // Create a print-friendly version
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Hóa đơn #${order.orderNumber || order.id.slice(-8)}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 20px; }
                            .order-info { margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .total { font-weight: bold; font-size: 1.2em; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>HÓA ĐƠN BÁN HÀNG</h1>
                            <p>Mã đơn hàng: #${order.orderNumber || order.id.slice(-8)}</p>
                            <p>Ngày: ${this.formatDateTime(order.createdAt)}</p>
                        </div>
                        
                        <div class="order-info">
                            <p><strong>Khách hàng:</strong> ${order.customerName || 'Khách lẻ'}</p>
                            ${order.customerPhone ? `<p><strong>Số điện thoại:</strong> ${order.customerPhone}</p>` : ''}
                            <p><strong>Phương thức thanh toán:</strong> ${this.getPaymentMethodText(order.paymentMethod)}</p>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Đơn giá</th>
                                    <th>Số lượng</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(order.orderItems || []).map(item => `
                                    <tr>
                                        <td>${item.product?.name || 'Sản phẩm không xác định'}</td>
                                        <td>${this.formatCurrency(item.price)}</td>
                                        <td>${item.quantity}</td>
                                        <td>${this.formatCurrency(item.subtotal)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="total">
                            <p>Tạm tính: ${this.formatCurrency(order.subtotal)}</p>
                            ${order.discount > 0 ? `<p>Giảm giá: -${this.formatCurrency(order.discount)}</p>` : ''}
                            <p>Thuế: ${this.formatCurrency(order.tax)}</p>
                            <p><strong>Tổng cộng: ${this.formatCurrency(order.total)}</strong></p>
                        </div>

                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();

        } catch (error) {
            console.error('Failed to print receipt:', error);
            showToast('Lỗi khi in hóa đơn: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    printReceipt() {
        if (this.selectedOrder) {
            this.printOrderReceipt(this.selectedOrder.id);
        }
    }

    async exportOrders() {
        try {
            showLoading('Đang xuất danh sách đơn hàng...');
            
            // Create CSV content
            const headers = ['Mã đơn hàng', 'Khách hàng', 'Số điện thoại', 'Tổng tiền', 'Trạng thái', 'Phương thức thanh toán', 'Ngày tạo'];
            const csvContent = [
                headers.join(','),
                ...this.orders.map(order => [
                    order.orderNumber || order.id.slice(-8),
                    order.customerName || 'Khách lẻ',
                    order.customerPhone || '',
                    order.total,
                    this.getStatusText(order.status),
                    this.getPaymentMethodText(order.paymentMethod),
                    this.formatDateTime(order.createdAt)
                ].map(field => `"${field}"`).join(','))
            ].join('\n');

            // Download CSV file
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('Xuất file thành công', 'success');
        } catch (error) {
            console.error('Failed to export orders:', error);
            showToast('Lỗi khi xuất file: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    // Utility methods
    getStatusText(status) {
        const statusMap = {
            'PENDING': 'Chờ xử lý',
            'PROCESSING': 'Đang xử lý',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || status;
    }

    getStatusBadgeClass(status) {
        const classMap = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'PROCESSING': 'bg-blue-100 text-blue-800',
            'COMPLETED': 'bg-green-100 text-green-800',
            'CANCELLED': 'bg-red-100 text-red-800'
        };
        return classMap[status] || 'bg-gray-100 text-gray-800';
    }

    getPaymentMethodText(method) {
        const methodMap = {
            'CASH': 'Tiền mặt',
            'CARD': 'Thẻ',
            'BANK_TRANSFER': 'Chuyển khoản',
            'E_WALLET': 'Ví điện tử'
        };
        return methodMap[method] || method;
    }

    getPaymentMethodBadgeClass(method) {
        const classMap = {
            'CASH': 'bg-green-100 text-green-800',
            'CARD': 'bg-blue-100 text-blue-800',
            'BANK_TRANSFER': 'bg-purple-100 text-purple-800',
            'E_WALLET': 'bg-orange-100 text-orange-800'
        };
        return classMap[method] || 'bg-gray-100 text-gray-800';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    }
}

// Initialize orders page
document.addEventListener('DOMContentLoaded', () => {
    window.ordersPage = new OrdersPage();
});
