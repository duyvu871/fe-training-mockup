/**
 * POS Products Management Module
 */

import { apiGet, API_ENDPOINTS } from '../core/api.js';
import { showToast } from '../core/notifications.js';
import { formatCurrency } from '../core/utils.js';

export class ProductsManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.filteredProducts = [];
        this.currentSearch = '';
        this.currentCategory = '';
    }

    async loadCategories() {
        try {
            const response = await apiGet(API_ENDPOINTS.CATEGORIES.LIST);
            this.categories = response.data.categories || [];
            this.updateCategoryFilter();
            return this.categories;
        } catch (error) {
            console.error('Failed to load categories:', error);
            showToast('Không thể tải danh mục sản phẩm', 'error');
            return [];
        }
    }

    async loadProducts(search = '', categoryId = '') {
        try {
            const params = new URLSearchParams({
                limit: '100',
                ...(search && { search }),
                ...(categoryId && { categoryId })
            });

            const response = await apiGet(`${API_ENDPOINTS.PRODUCTS.LIST}?${params}`);
            this.products = response.data.products || [];
            this.applyFilters();
            return this.products;
        } catch (error) {
            console.error('Failed to load products:', error);
            showToast('Không thể tải danh sách sản phẩm', 'error');
            return [];
        }
    }

    applyFilters() {
        let filtered = [...this.products];

        // Apply search filter
        if (this.currentSearch) {
            const search = this.currentSearch.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(search) ||
                product.sku.toLowerCase().includes(search) ||
                (product.barcode && product.barcode.toLowerCase().includes(search))
            );
        }

        // Apply category filter
        if (this.currentCategory) {
            filtered = filtered.filter(product => product.categoryId === this.currentCategory);
        }

        this.filteredProducts = filtered;
        this.updateProductsGrid();
    }

    setSearch(search) {
        this.currentSearch = search;
        this.applyFilters();
    }

    setCategory(categoryId) {
        this.currentCategory = categoryId;
        this.applyFilters();
    }

    findByBarcode(barcode) {
        return this.products.find(p => p.barcode === barcode);
    }

    findById(id) {
        return this.products.find(p => p.id === id);
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

        if (this.filteredProducts.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500">Không tìm thấy sản phẩm nào</p>
                    ${this.currentSearch || this.currentCategory ? 
                        '<button onclick="posPage.clearFilters()" class="mt-2 text-primary-600 hover:text-primary-500 text-sm">Xóa bộ lọc</button>' : 
                        ''
                    }
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredProducts.map(product => this.renderProductCard(product)).join('');
    }

    renderProductCard(product) {
        const isOutOfStock = product.stock <= 0;
        const isLowStock = product.stock <= (product.minStock || 5);

        return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                 data-product-id="${product.id}" 
                 ${!isOutOfStock ? `onclick="posPage.addToCart('${product.id}')"` : ''}>
                <div class="aspect-w-1 aspect-h-1 mb-3">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" class="w-full h-24 object-cover rounded-md">` :
                        `<div class="w-full h-24 bg-gray-200 rounded-md flex items-center justify-center">
                            <i class="fas fa-image text-gray-400 text-2xl"></i>
                         </div>`
                    }
                    ${isOutOfStock ? 
                        '<div class="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-md flex items-center justify-center"><span class="text-white text-xs font-bold">HẾT HÀNG</span></div>' : 
                        ''
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
                        <span class="text-xs ${isLowStock && !isOutOfStock ? 'text-orange-600' : 'text-gray-500'}">
                            ${product.stock} ${product.unit || ''}
                        </span>
                    </div>
                    ${isOutOfStock ? 
                        '<div class="text-xs text-red-600 font-medium">Hết hàng</div>' : 
                        isLowStock ? 
                        '<div class="text-xs text-orange-600 font-medium">Sắp hết</div>' : ''
                    }
                </div>
            </div>
        `;
    }

    // Keyboard navigation support
    selectProduct(direction) {
        const productCards = document.querySelectorAll('.product-card:not(.out-of-stock)');
        const currentSelected = document.querySelector('.product-card.selected');
        
        if (productCards.length === 0) return;
        
        let nextIndex = 0;
        
        if (currentSelected) {
            const currentIndex = Array.from(productCards).indexOf(currentSelected);
            if (direction === 'next') {
                nextIndex = (currentIndex + 1) % productCards.length;
            } else if (direction === 'prev') {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : productCards.length - 1;
            }
            currentSelected.classList.remove('selected');
        }
        
        productCards[nextIndex].classList.add('selected');
        productCards[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    addSelectedProduct() {
        const selected = document.querySelector('.product-card.selected');
        if (selected) {
            const productId = selected.dataset.productId;
            if (window.posPage) {
                window.posPage.addToCart(productId);
            }
        }
    }
}

export default ProductsManager;
