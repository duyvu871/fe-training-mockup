/**
 * Products Page JavaScript
 */

import { requireAuth, getUserData, isAdmin } from '../core/auth.js';
import { showToast, showLoading, hideLoading, showConfirm } from '../core/notifications.js';
import { apiGet, apiPost, apiPut, apiDelete, API_ENDPOINTS } from '../core/api.js';

class ProductsPage {
    constructor() {
        this.user = getUserData();
        this.products = [];
        this.categories = [];
        this.currentPage = 1;
        this.pageSize = 25;
        this.totalPages = 1;
        this.totalItems = 0;
        this.filters = {
            search: '',
            category: '',
            status: '',
            sort: 'name:asc'
        };
        this.selectedProducts = new Set();
        this.editingProduct = null;
        
        this.init();
    }

    init() {
        // Protect route
        if (!requireAuth()) {
            return;
        }

        this.bindEvents();
        this.loadCategories();
        this.loadProducts();
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadProducts();
                }, 500);
            });
        }

        // Filters
        const filterElements = ['category-filter', 'status-filter', 'sort-filter'];
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const filterName = id.replace('-filter', '').replace('-', '');
                    this.filters[filterName === 'category' ? 'category' : filterName === 'status' ? 'status' : 'sort'] = e.target.value;
                    this.currentPage = 1;
                    this.loadProducts();
                });
            }
        });

        // Page size
        const pageSizeSelect = document.getElementById('page-size');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.pageSize = parseInt(e.target.value);
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showProductModal();
            });
        }

        // Export/Import buttons
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportProducts();
            });
        }

        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.showImportModal();
            });
        }

        // Modal events
        this.bindModalEvents();

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }
    }

    bindModalEvents() {
        // Product modal
        const productModal = document.getElementById('product-modal');
        const closeModalBtns = document.querySelectorAll('#close-product-modal, #cancel-product-btn');
        
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideProductModal();
            });
        });

        // Product form
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        // Bulk actions modal
        const bulkModal = document.getElementById('bulk-actions-modal');
        const closeBulkBtn = document.getElementById('close-bulk-modal');
        if (closeBulkBtn) {
            closeBulkBtn.addEventListener('click', () => {
                this.hideBulkModal();
            });
        }

        // Bulk action buttons
        const bulkActionBtns = document.querySelectorAll('[data-action]');
        bulkActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                this.performBulkAction(action);
            });
        });

        // Close modals on backdrop click
        [productModal, bulkModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.add('hidden');
                    }
                });
            }
        });
    }

    async loadCategories() {
        try {
            const response = await apiGet(API_ENDPOINTS.CATEGORIES.LIST);
            this.categories = response.data?.categories || [];
            this.populateCategoryFilters();
        } catch (error) {
            console.error('Failed to load categories:', error);
            showToast('Không thể tải danh sách danh mục', 'error');
        }
    }

    populateCategoryFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const productCategory = document.getElementById('product-category');
        
        const categoryOptions = this.categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');

        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' + categoryOptions;
        }

        if (productCategory) {
            productCategory.innerHTML = '<option value="">Chọn danh mục</option>' + categoryOptions;
        }
    }

    async loadProducts() {
        try {
            showLoading('Đang tải danh sách sản phẩm...');

            const params = new URLSearchParams({
                page: this.currentPage.toString(),
                limit: this.pageSize.toString(),
                sort: this.filters.sort
            });

            if (this.filters.search) {
                params.append('search', this.filters.search);
            }
            if (this.filters.category) {
                params.append('categoryId', this.filters.category);
            }
            if (this.filters.status) {
                params.append('status', this.filters.status);
            }

            const response = await apiGet(`${API_ENDPOINTS.PRODUCTS.LIST}?${params}`);
            
            this.products = response.data?.products || [];
            this.totalItems = response.data?.pagination?.total || 0;
            this.totalPages = response.data?.pagination?.totalPages || 1;

            this.renderProducts();
            this.renderPagination();
            this.updateStats();
            this.updateProductsCount();

        } catch (error) {
            console.error('Failed to load products:', error);
            showToast('Không thể tải danh sách sản phẩm', 'error');
            this.renderError();
        } finally {
            hideLoading();
        }
    }

    renderProducts() {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center">
                        <div class="text-gray-500">
                            <i class="fas fa-box-open text-4xl mb-4"></i>
                            <p class="text-lg">Không có sản phẩm nào</p>
                            <p class="text-sm">Hãy thêm sản phẩm đầu tiên của bạn</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.products.map(product => this.renderProductRow(product)).join('');

        // Bind row events
        this.bindRowEvents();
    }

    renderProductRow(product) {
        const isSelected = this.selectedProducts.has(product.id);
        const stockStatus = this.getStockStatus(product);
        const stockClass = this.getStockClass(stockStatus);

        return `
            <tr class="hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" class="product-checkbox h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
                           data-product-id="${product.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            ${product.image ? 
                                `<img class="h-10 w-10 rounded-md object-cover" src="${product.image}" alt="${product.name}">` :
                                `<div class="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                    <i class="fas fa-image text-gray-400"></i>
                                </div>`
                            }
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            ${product.description ? `<div class="text-sm text-gray-500">${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 font-mono">${product.sku}</div>
                    ${product.barcode ? `<div class="text-sm text-gray-500">${product.barcode}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${product.category?.name || 'Chưa phân loại'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900">${this.formatCurrency(product.price)}</div>
                    ${product.cost ? `<div class="text-sm text-gray-500">Vốn: ${this.formatCurrency(product.cost)}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${stockClass}">${product.stock} ${product.unit || ''}</div>
                    ${product.minStock ? `<div class="text-xs text-gray-500">Tối thiểu: ${product.minStock}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusBadgeClass(product.isActive, stockStatus)}">
                        ${this.getStatusText(product.isActive, stockStatus)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                        <button class="text-primary-600 hover:text-primary-900 edit-btn" data-product-id="${product.id}" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-900 view-btn" data-product-id="${product.id}" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${isAdmin() ? `
                        <button class="text-red-600 hover:text-red-900 delete-btn" data-product-id="${product.id}" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    bindRowEvents() {
        // Checkbox events
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const productId = e.target.dataset.productId;
                if (e.target.checked) {
                    this.selectedProducts.add(productId);
                } else {
                    this.selectedProducts.delete(productId);
                }
                this.updateSelectAllCheckbox();
                this.updateBulkActionsVisibility();
            });
        });

        // Action buttons
        const editBtns = document.querySelectorAll('.edit-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.edit-btn').dataset.productId;
                this.editProduct(productId);
            });
        });

        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.view-btn').dataset.productId;
                this.viewProduct(productId);
            });
        });

        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.delete-btn').dataset.productId;
                this.deleteProduct(productId);
            });
        });
    }

    renderPagination() {
        const paginationNav = document.getElementById('pagination-nav');
        if (!paginationNav) return;

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}" 
                    ${this.currentPage === 1 ? 'disabled' : ''} onclick="productsPage.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `
                <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" onclick="productsPage.goToPage(1)">1</button>
            `;
            if (startPage > 2) {
                paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${i === this.currentPage ? 'bg-primary-50 border-primary-500 text-primary-600' : 'bg-white text-gray-700 hover:bg-gray-50'}" onclick="productsPage.goToPage(${i})">${i}</button>
            `;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
            }
            paginationHTML += `
                <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" onclick="productsPage.goToPage(${this.totalPages})">${this.totalPages}</button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === this.totalPages ? 'cursor-not-allowed opacity-50' : ''}" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''} onclick="productsPage.goToPage(${this.currentPage + 1})">
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
            this.loadProducts();
        }
    }

    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('total-products-stat').textContent = stats.total;
        document.getElementById('active-products-stat').textContent = stats.active;
        document.getElementById('low-stock-stat').textContent = stats.lowStock;
        document.getElementById('out-of-stock-stat').textContent = stats.outOfStock;
    }

    calculateStats() {
        return {
            total: this.totalItems,
            active: this.products.filter(p => p.isActive).length,
            lowStock: this.products.filter(p => p.stock <= (p.minStock || 0) && p.stock > 0).length,
            outOfStock: this.products.filter(p => p.stock === 0).length
        };
    }

    updateProductsCount() {
        const countElement = document.getElementById('products-count');
        if (countElement) {
            countElement.textContent = this.totalItems.toLocaleString();
        }
    }

    // Product CRUD operations
    showProductModal(product = null) {
        this.editingProduct = product;
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('product-form');

        if (product) {
            title.textContent = 'Chỉnh sửa sản phẩm';
            this.populateProductForm(product);
        } else {
            title.textContent = 'Thêm sản phẩm mới';
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    hideProductModal() {
        const modal = document.getElementById('product-modal');
        modal.classList.add('hidden');
        this.editingProduct = null;
    }

    populateProductForm(product) {
        const form = document.getElementById('product-form');
        
        // Map product fields to form fields
        const fieldMapping = {
            'name': product.name,
            'sku': product.sku,
            'description': product.description,
            'categoryId': product.categoryId || product.category?.id,
            'unit': product.unit,
            'cost': product.cost,
            'price': product.price,
            'stock': product.stock,
            'minStock': product.minStock,
            'barcode': product.barcode,
            'image': product.image
        };
        
        Object.entries(fieldMapping).forEach(([fieldName, value]) => {
            const element = form.querySelector(`[name="${fieldName}"]`);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        });

        // Set checkbox for isActive if exists
        const isActiveCheckbox = form.querySelector('[name="isActive"]');
        if (isActiveCheckbox) {
            isActiveCheckbox.checked = product.isActive !== false;
        }

        console.log('Populated form with product data:', product);
    }

    async saveProduct() {
        try {
            showLoading(this.editingProduct ? 'Đang cập nhật sản phẩm...' : 'Đang thêm sản phẩm...');

            const formData = new FormData(document.getElementById('product-form'));
            const productData = Object.fromEntries(formData.entries());

            // Convert numeric fields
            ['price', 'cost', 'stock', 'minStock'].forEach(field => {
                if (productData[field] && productData[field] !== '') {
                    productData[field] = parseFloat(productData[field]);
                }
            });

            // Handle boolean fields
            productData.isActive = productData.isActive === 'on' || productData.isActive === true;

            // Remove empty fields
            Object.keys(productData).forEach(key => {
                if (productData[key] === '' || productData[key] === null) {
                    delete productData[key];
                }
            });

            console.log('Saving product data:', productData);
            console.log('Editing product:', this.editingProduct);

            let response;
            if (this.editingProduct) {
                console.log('Updating product with ID:', this.editingProduct.id);
                response = await apiPut(API_ENDPOINTS.PRODUCTS.UPDATE(this.editingProduct.id), productData);
            } else {
                console.log('Creating new product');
                response = await apiPost(API_ENDPOINTS.PRODUCTS.CREATE, productData);
            }

            console.log('Save response:', response);

            if (response.success) {
                showToast(this.editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công', 'success');
                this.hideProductModal();
                
                // Reload products to see changes
                await this.loadProducts();
            } else {
                throw new Error(response.message || 'Lỗi không xác định');
            }

        } catch (error) {
            console.error('Failed to save product:', error);
            showToast('Có lỗi xảy ra khi lưu sản phẩm: ' + (error.message || error), 'error');
        } finally {
            hideLoading();
        }
    }

    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    }

    async viewProduct(productId) {
        // Implement product detail view
        showToast('Tính năng xem chi tiết đang được phát triển', 'info');
    }

    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const confirmed = await showConfirm(
            'Xác nhận xóa sản phẩm',
            `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`
        );

        if (!confirmed) return;

        try {
            showLoading('Đang xóa sản phẩm...');
            await apiDelete(API_ENDPOINTS.PRODUCTS.DELETE(productId));
            showToast('Xóa sản phẩm thành công', 'success');
            this.loadProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
            showToast('Có lỗi xảy ra khi xóa sản phẩm', 'error');
        } finally {
            hideLoading();
        }
    }

    // Bulk operations
    toggleSelectAll(checked) {
        this.selectedProducts.clear();
        
        if (checked) {
            this.products.forEach(product => {
                this.selectedProducts.add(product.id);
            });
        }

        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });

        this.updateBulkActionsVisibility();
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all');
        if (!selectAllCheckbox) return;

        const totalCheckboxes = document.querySelectorAll('.product-checkbox').length;
        const checkedCount = this.selectedProducts.size;

        selectAllCheckbox.checked = checkedCount === totalCheckboxes && totalCheckboxes > 0;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCheckboxes;
    }

    updateBulkActionsVisibility() {
        // Show bulk actions button if any products are selected
        const selectedCount = this.selectedProducts.size;
        if (selectedCount > 0) {
            // You can add a bulk actions button to the UI and show it here
            console.log(`${selectedCount} products selected`);
        }
    }

    showBulkModal() {
        const modal = document.getElementById('bulk-actions-modal');
        modal.classList.remove('hidden');
    }

    hideBulkModal() {
        const modal = document.getElementById('bulk-actions-modal');
        modal.classList.add('hidden');
    }

    async performBulkAction(action) {
        if (this.selectedProducts.size === 0) return;

        const productIds = Array.from(this.selectedProducts);
        
        try {
            showLoading('Đang thực hiện thao tác...');
            
            switch (action) {
                case 'activate':
                    // Implement bulk activate
                    break;
                case 'deactivate':
                    // Implement bulk deactivate
                    break;
                case 'update-category':
                    // Implement bulk category update
                    break;
                case 'delete':
                    await this.bulkDelete(productIds);
                    break;
            }

            this.hideBulkModal();
            this.selectedProducts.clear();
            this.loadProducts();

        } catch (error) {
            console.error('Failed to perform bulk action:', error);
            showToast('Có lỗi xảy ra khi thực hiện thao tác', 'error');
        } finally {
            hideLoading();
        }
    }

    async bulkDelete(productIds) {
        const confirmed = await showConfirm(
            'Xác nhận xóa hàng loạt',
            `Bạn có chắc chắn muốn xóa ${productIds.length} sản phẩm đã chọn? Hành động này không thể hoàn tác.`
        );

        if (!confirmed) return;

        // Delete each product (you might want to implement a bulk delete API endpoint)
        for (const productId of productIds) {
            await apiDelete(API_ENDPOINTS.PRODUCTS.DELETE(productId));
        }

        showToast(`Đã xóa ${productIds.length} sản phẩm`, 'success');
    }

    // Utility methods
    clearFilters() {
        this.filters = {
            search: '',
            category: '',
            status: '',
            sort: 'name:asc'
        };

        document.getElementById('search').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('sort-filter').value = 'name:asc';

        this.currentPage = 1;
        this.loadProducts();
    }

    async exportProducts() {
        try {
            showLoading('Đang xuất dữ liệu...');
            // Implement export functionality
            showToast('Tính năng xuất dữ liệu đang được phát triển', 'info');
        } catch (error) {
            console.error('Failed to export products:', error);
            showToast('Có lỗi xảy ra khi xuất dữ liệu', 'error');
        } finally {
            hideLoading();
        }
    }

    showImportModal() {
        showToast('Tính năng nhập dữ liệu đang được phát triển', 'info');
    }

    getStockStatus(product) {
        if (product.stock === 0) return 'out-of-stock';
        if (product.stock <= (product.minStock || 0)) return 'low-stock';
        return 'in-stock';
    }

    getStockClass(status) {
        const classes = {
            'in-stock': 'text-green-600 font-semibold',
            'low-stock': 'text-yellow-600 font-semibold',
            'out-of-stock': 'text-red-600 font-semibold'
        };
        return classes[status] || 'text-gray-600';
    }

    getStatusBadgeClass(isActive, stockStatus) {
        if (!isActive) return 'bg-gray-100 text-gray-800';
        
        const classes = {
            'in-stock': 'bg-green-100 text-green-800',
            'low-stock': 'bg-yellow-100 text-yellow-800',
            'out-of-stock': 'bg-red-100 text-red-800'
        };
        return classes[stockStatus] || 'bg-gray-100 text-gray-800';
    }

    getStatusText(isActive, stockStatus) {
        if (!isActive) return 'Ngừng bán';
        
        const texts = {
            'in-stock': 'Đang bán',
            'low-stock': 'Sắp hết',
            'out-of-stock': 'Hết hàng'
        };
        return texts[stockStatus] || 'Không xác định';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    renderError() {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center">
                    <div class="text-red-500">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p class="text-lg">Không thể tải danh sách sản phẩm</p>
                        <button onclick="productsPage.loadProducts()" class="mt-2 text-primary-600 hover:text-primary-800">
                            <i class="fas fa-redo mr-1"></i>Thử lại
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Initialize products page when DOM is loaded
let productsPage;
document.addEventListener('DOMContentLoaded', () => {
    productsPage = new ProductsPage();
    
    // Make it globally available for pagination clicks
    window.productsPage = productsPage;
});
