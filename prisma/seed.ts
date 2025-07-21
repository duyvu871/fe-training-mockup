import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { categoriesData } from './seed-data/categories';
import { productsData } from './seed-data/products';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // 1. Tạo users
  console.log('👥 Tạo users...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@pos.local',
      password: hashedPassword,
      firstName: 'Quản trị',
      lastName: 'Hệ thống',
      phone: '0123456789',
      role: UserRole.ADMIN,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      email: 'cashier@pos.local',
      password: hashedPassword,
      firstName: 'Thu ngân',
      lastName: 'Demo',
      phone: '0987654321',
      role: UserRole.CASHIER,
    },
  });

  console.log(`✅ Đã tạo ${2} users`);

  // 2. Tạo categories
  console.log('📂 Tạo categories...');
  const categories = await Promise.all(
    categoriesData.map(async (category) =>
      prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      })
    )
  );
  console.log(`✅ Đã tạo ${categories.length} categories`);

  // 3. Tạo products
  console.log('📦 Tạo products...');
  const products = await Promise.all(
    productsData.map(async (product) => {
      const category = categories.find(c => c.name === product.categoryName);
      if (!category) {
        throw new Error(`Không tìm thấy category: ${product.categoryName}`);
      }

      return prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: {
          name: product.name,
          sku: product.sku,
          description: product.description,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          minStock: product.minStock,
          unit: product.unit,
          barcode: product.barcode,
          categoryId: category.id,
        },
      });
    })
  );
  console.log(`✅ Đã tạo ${products.length} products`);

  // 4. Tạo sample orders
  console.log('🛒 Tạo sample orders...');
  
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      subtotal: 150000,
      tax: 15000,
      total: 165000,
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      createdById: cashierUser.id,
      orderItems: {
        create: [
          {
            productId: products[0]!.id,
            quantity: 2,
            price: 50000,
            subtotal: 100000,
          },
          {
            productId: products[1]!.id,
            quantity: 1,
            price: 50000,
            subtotal: 50000,
          },
        ],
      },
    },
  });

  // 5. Tạo stock movements
  console.log('📊 Tạo stock movements...');
  
  await prisma.stockMovement.createMany({
    data: products.slice(0, 3).map((product) => ({
      productId: product.id,
      type: 'PURCHASE',
      quantity: product.stock,
      previousStock: 0,
      newStock: product.stock,
      reason: 'Nhập kho ban đầu',
      reference: 'INIT-001',
      createdById: adminUser.id,
    })),
  });

  console.log('✅ Seed dữ liệu hoàn thành!');
  console.log('');
  console.log('📋 Tài khoản demo:');
  console.log('👤 Admin: admin / password123');
  console.log('🏪 Cashier: cashier / password123');
  console.log('');
  console.log('🌐 Truy cập:');
  console.log('• API: http://localhost:3000');
  console.log('• Docs: http://localhost:3000/api-docs');
  console.log('• Database Studio: npm run db:studio');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
