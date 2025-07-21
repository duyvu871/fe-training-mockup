/**
 * Dashboard Page JavaScript
 */

import { requireAuth, getUserData, logout, isAdmin } from '../core/auth.js';
import { showToast, showLoading, hideLoading } from '../core/notifications.js';
import { apiGet, API_ENDPOINTS } from '../core/api.js';

class DashboardPage {
    constructor() {
        this.user = getUserData();
        this.dashboardData = null;
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        // Protect route
        if (!requireAuth()) {
            return;
        }

        this.bindEvents();
        this.loadDashboardData();
        this.setupAutoRefresh();
        this.updateUserInfo();
        this.updateLastUpdatedTime();
    }

    bindEvents() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshDashboard.bind(this));
        }

        // Quick action buttons
        const quickActions = {
            'new-order-btn': '/pos',
            'manage-products-btn': '/products',
            'view-orders-btn': '/orders',
            'manage-stock-btn': '/stock',
            'manage-users-btn': '/users'
        };

        Object.entries(quickActions).forEach(([buttonId, url]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    window.location.href = url;
                });
            }
        });

        // Real-time updates toggle
        const realTimeToggle = document.getElementById('realtime-toggle');
        if (realTimeToggle) {
            realTimeToggle.addEventListener('change', this.toggleRealTimeUpdates.bind(this));
        }
    }

    async loadDashboardData() {
        try {
            showLoading('Đang tải thông tin dashboard...');
            
            // Load dashboard statistics
            const [statsData, recentOrders, lowStockAlerts] = await Promise.all([
                this.loadStatistics(),
                this.loadRecentOrders(),
                this.loadLowStockAlerts()
            ]);

            this.dashboardData = {
                stats: statsData,
                recentOrders: recentOrders,
                lowStockAlerts: lowStockAlerts
            };

            console.log('Dashboard data loaded successfully:', this.dashboardData);
            this.updateDashboard();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showToast('Không thể tải dữ liệu dashboard. Vui lòng thử lại.', 'error');
        } finally {
            hideLoading();
        }
    }

    async loadStatistics() {
        try {
            const response = await apiGet(API_ENDPOINTS.DASHBOARD.STATS);
            return response.data.stats;
        } catch (error) {
            console.error('Failed to load statistics:', error);
            // Fallback to mock data if API fails
            return {
                sales: {
                    today: 0,
                    thisWeek: 0,
                    thisMonth: 0,
                    growth: 0
                },
                orders: {
                    today: 0,
                    pending: 0,
                    completed: 0,
                    cancelled: 0
                },
                products: {
                    total: 0,
                    lowStock: 0,
                    outOfStock: 0
                },
                customers: {
                    total: 0,
                    new: 0,
                    returning: 0
                }
            };
        }
    }

    async loadRecentOrders() {
        try {
            const response = await apiGet(`${API_ENDPOINTS.ORDERS.LIST}?limit=5&sortBy=createdAt&sortOrder=desc`);
            return response.data.orders || [];
        } catch (error) {
            console.error('Failed to load recent orders:', error);
            return [];
        }
    }

    async loadLowStockAlerts() {
        try {
            const response = await apiGet(API_ENDPOINTS.STOCK.ALERTS);
            return response.data || [];
        } catch (error) {
            console.error('Failed to load stock alerts:', error);
            return [];
        }
    }

    updateDashboard() {
        this.updateStatistics();
        this.updateRecentOrders();
        this.updateLowStockAlerts();
        this.updateCharts();
    }

    updateStatistics() {
        if (!this.dashboardData?.stats) return;

        const stats = this.dashboardData.stats;
        
        // Update stat cards with new data structure
        this.updateStatCard('today-revenue', this.formatCurrency(stats.sales?.today || 0));
        this.updateStatCard('today-orders', stats.orders?.today || 0);
        this.updateStatCard('total-products', stats.products?.total || 0);
        this.updateStatCard('low-stock-count', stats.products?.lowStock || 0);
        
        if (isAdmin()) {
            this.updateStatCard('total-users', stats.customers?.total || 0);
            this.updateStatCard('monthly-revenue', this.formatCurrency(stats.sales?.thisMonth || 0));
            this.updateStatCard('weekly-revenue', this.formatCurrency(stats.sales?.thisWeek || 0));
        }
        
        // Update growth indicators
        this.updateGrowthIndicator('revenue-growth', stats.sales?.growth || 0);
    }

    updateGrowthIndicator(indicatorId, growthPercentage) {
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            const isPositive = growthPercentage >= 0;
            const icon = isPositive ? '↗' : '↘';
            const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
            
            indicator.innerHTML = `
                <span class="${colorClass}">
                    ${icon} ${Math.abs(growthPercentage).toFixed(1)}%
                </span>
            `;
        }
    }

    updateStatCard(cardId, value) {
        const card = document.getElementById(cardId);
        if (card) {
            card.textContent = value;
            
            // Add animation
            card.classList.add('animate-pulse');
            setTimeout(() => {
                card.classList.remove('animate-pulse');
            }, 1000);
        }
    }

    updateRecentOrders() {
        const container = document.getElementById('recent-orders');
        if (!container) return;

        const orders = this.dashboardData?.recentOrders;
        
        // Check if orders is valid array
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        <div class="text-center">
                            <i class="fas fa-receipt text-3xl mb-2"></i>
                            <p>Chưa có đơn hàng nào gần đây</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        try {
            container.innerHTML = orders.map(order => `
                <tr class="hover:bg-gray-50 cursor-pointer" onclick="window.location.href='/orders/${order.id}'">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">#${order.orderNumber || 'N/A'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${order.customerName || 'Khách lẻ'}</div>
                        <div class="text-sm text-gray-500">${order.customerPhone || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-semibold text-gray-900">${this.formatCurrency(order.total)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusBadgeClass(order.status)}">
                            ${this.getStatusText(order.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${this.formatDateTime(order.createdAt)}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error rendering orders:', error);
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-red-500">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                            <p>Lỗi khi hiển thị đơn hàng</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    updateLowStockAlerts() {
        const container = document.getElementById('low-stock-alerts');
        if (!container) return;

        const alerts = this.dashboardData?.lowStockAlerts;
        
        if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <i class="fas fa-check-circle text-3xl mb-2 text-green-500"></i>
                    <p>Tất cả sản phẩm đều đủ hàng</p>
                </div>
            `;
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                    <div>
                        <p class="font-medium text-gray-900">${alert.productName}</p>
                        <p class="text-sm text-gray-600">SKU: ${alert.sku}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-red-600">${alert.currentStock}</p>
                    <p class="text-xs text-gray-500">Tối thiểu: ${alert.minStock}</p>
                </div>
            </div>
        `).join('');
    }

    updateCharts() {
        // This would update charts using Chart.js or similar library
        // For now, we'll just log that charts should be updated
        console.log('Updating dashboard charts...');
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('user-name');
        const userRoleElement = document.getElementById('user-role');
        const userAvatarElement = document.getElementById('user-avatar');

        if (userNameElement && this.user) {
            userNameElement.textContent = this.user.username || 'User';
        }

        if (userRoleElement && this.user) {
            const roleText = this.user.role === 'admin' ? 'Quản trị viên' : 'Thu ngân';
            userRoleElement.textContent = roleText;
        }

        if (userAvatarElement && this.user) {
            // Set user avatar or initials
            const initials = (this.user.firstName?.[0] || '') + (this.user.lastName?.[0] || '') || this.user.username?.[0]?.toUpperCase() || 'U';
            userAvatarElement.textContent = initials;
        }
    }

    updateLastUpdatedTime() {
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleString('vi-VN');
        }
    }

    async handleLogout() {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API fails
            window.location.href = '/login';
        }
    }

    /**
     * Refresh dashboard data - call this after transactions
     */
    async refreshDashboard() {
        try {
            await this.loadDashboardData();
            showToast('Đã cập nhật thông tin dashboard', 'success');
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
            showToast('Không thể cập nhật dashboard', 'error');
        }
    }

    /**
     * Enable auto-refresh for real-time updates
     */
    setupAutoRefresh() {
        // Refresh dashboard every 30 seconds
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 30000); // 30 seconds
    }

    toggleRealTimeUpdates(event) {
        const enabled = event.target.checked;
        
        if (enabled) {
            this.setupAutoRefresh();
            showToast('Đã bật cập nhật tự động', 'success', 2000);
        } else {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
            showToast('Đã tắt cập nhật tự động', 'info', 2000);
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusColor(status) {
        const colors = {
            'PENDING': 'text-yellow-600',
            'PROCESSING': 'text-blue-600',
            'COMPLETED': 'text-green-600',
            'CANCELLED': 'text-red-600'
        };
        return colors[status] || 'text-gray-600';
    }

    getStatusBadgeClass(status) {
        const classes = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'PROCESSING': 'bg-blue-100 text-blue-800',
            'COMPLETED': 'bg-green-100 text-green-800',
            'CANCELLED': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusText(status) {
        const texts = {
            'PENDING': 'Chờ xử lý',
            'PROCESSING': 'Đang xử lý',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Đã hủy'
        };
        return texts[status] || status;
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Cleanup when page unloads
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Export dashboard refresh function for use by other pages
window.refreshDashboard = async function() {
    if (window.dashboardInstance) {
        await window.dashboardInstance.refreshDashboard();
    }
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DashboardPage();
    window.dashboardInstance = dashboard;
});

// Handle visibility change to pause/resume updates when tab is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause updates when tab is not visible
        console.log('Dashboard paused - tab not visible');
    } else {
        // Resume updates when tab becomes visible
        console.log('Dashboard resumed - tab visible');
    }
});
