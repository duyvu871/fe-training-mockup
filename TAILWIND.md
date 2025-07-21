# Hướng dẫn sử dụng Tailwind CSS

## Cài đặt và Khởi chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy trong chế độ development
```bash
npm run dev
```
Script này sẽ tự động:
- Chạy Tailwind CSS trong chế độ watch để rebuild CSS khi có thay đổi
- Chạy TypeScript compiler trong chế độ watch
- Tự động restart server khi có thay đổi code

### 3. Build cho production
```bash
npm run tailwind:build
npm run build
```

## Cấu trúc File

```
src/
├── public/
│   └── css/
│       ├── tailwind.css      # Input CSS file (commit vào git)
│       └── output.css        # Generated CSS file (không commit)
├── views/
│   └── demo.html            # File demo UI
└── ...
tailwind.config.js           # Cấu hình Tailwind
postcss.config.js           # Cấu hình PostCSS
```

## Các Script Available

- `npm run tailwind:dev` - Chạy Tailwind trong chế độ watch
- `npm run tailwind:build` - Build Tailwind cho production (minified)
- `npm run dev` - Chạy cả Tailwind watch và TypeScript watch
- `npm run build` - Build toàn bộ project cho production

## Customization

### Colors
Đã cấu hình các màu chủ đạo trong `tailwind.config.js`:
- `primary` - Màu chính (blue)
- `secondary` - Màu phụ (gray)
- `success` - Màu thành công (green)
- `warning` - Màu cảnh báo (yellow)
- `error` - Màu lỗi (red)

### Components
Đã tạo sẵn các component classes trong `src/public/css/tailwind.css`:
- `.btn`, `.btn-primary`, `.btn-secondary`, etc. - Buttons
- `.card`, `.card-header`, `.card-body`, `.card-footer` - Cards
- `.form-input`, `.form-label`, `.form-error` - Forms
- `.table` - Tables
- `.badge`, `.badge-primary`, etc. - Badges
- `.alert`, `.alert-success`, etc. - Alerts

### Utilities
Thêm các utility classes:
- `.gradient-primary`, `.gradient-secondary` - Gradient backgrounds
- `.glass`, `.glass-dark` - Glass morphism effects
- `.scrollbar-hide` - Hide scrollbars
- `.text-balance` - Text balance

## Ví dụ sử dụng

### Button
```html
<button class="btn-primary">Nút chính</button>
<button class="btn-secondary">Nút phụ</button>
<button class="btn-outline">Nút viền</button>
```

### Card
```html
<div class="card">
    <div class="card-header">
        <h3>Tiêu đề</h3>
    </div>
    <div class="card-body">
        <p>Nội dung card</p>
    </div>
    <div class="card-footer">
        <button class="btn-primary">Hành động</button>
    </div>
</div>
```

### Form
```html
<form>
    <label class="form-label">Tên sản phẩm</label>
    <input type="text" class="form-input" placeholder="Nhập tên sản phẩm">
    <div class="form-error">Lỗi validation</div>
</form>
```

### Badge
```html
<span class="badge-success">Hoàn thành</span>
<span class="badge-warning">Đang xử lý</span>
<span class="badge-error">Lỗi</span>
```

## Development Tips

1. **File watching**: Khi chạy `npm run dev`, Tailwind sẽ tự động rebuild CSS khi bạn thay đổi classes trong HTML/TS files.

2. **Production optimization**: Tailwind sẽ tự động loại bỏ unused CSS trong production build.

3. **Custom components**: Thêm custom components vào section `@layer components` trong `tailwind.css`.

4. **Debugging**: Sử dụng VS Code extension "Tailwind CSS IntelliSense" để có auto-complete và hover preview.

## Responsive Design

Sử dụng responsive prefixes:
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
    <!-- Responsive grid -->
</div>
```

Breakpoints:
- `sm`: 640px
- `md`: 768px  
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Dark Mode (Future)

Cấu hình đã được chuẩn bị cho dark mode trong `tailwind.css`. Có thể enable sau này bằng cách thêm `dark:` prefix:
```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
    <!-- Dark mode support -->
</div>
```
