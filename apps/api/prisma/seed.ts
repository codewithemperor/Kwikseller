/**
 * KWIKSELLER Database Seed Script
 * 
 * This script seeds the database with essential data:
 * - Super Admin user (the only user with SUPER_ADMIN role)
 * - System configurations
 * - Vendor milestones
 * 
 * Run with: bun run db:seed
 */

import { PrismaClient, UserRole, UserStatus, AdminRole, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configuration for super admin
const SUPER_ADMIN_CONFIG = {
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@kwikseller.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2024!',
  firstName: 'Super',
  lastName: 'Admin',
};

// System configurations to seed
const SYSTEM_CONFIGS = [
  { key: 'platform_fee_percent', value: '5' },
  { key: 'min_withdrawal_amount', value: '1000' },
  { key: 'delivery_fee_base', value: '500' },
  { key: 'delivery_fee_per_km', value: '50' },
  { key: 'max_products_starter', value: '10' },
  { key: 'max_products_growth', value: '50' },
  { key: 'max_products_pro', value: '200' },
  { key: 'max_products_scale', value: '1000' },
  { key: 'kwikcoins_per_referral', value: '100' },
  { key: 'otp_expiry_minutes', value: '10' },
  { key: 'password_reset_expiry_minutes', value: '15' },
];

// Vendor milestones to seed
const VENDOR_MILESTONES = [
  { key: 'first_product', name: 'First Product Listed', description: 'List your first product', coinsAwarded: 50, isRepeatable: false },
  { key: 'first_sale', name: 'First Sale', description: 'Complete your first sale', coinsAwarded: 100, isRepeatable: false },
  { key: 'sales_10', name: '10 Sales Milestone', description: 'Complete 10 sales', coinsAwarded: 200, isRepeatable: false },
  { key: 'sales_50', name: '50 Sales Milestone', description: 'Complete 50 sales', coinsAwarded: 500, isRepeatable: false },
  { key: 'sales_100', name: '100 Sales Milestone', description: 'Complete 100 sales', coinsAwarded: 1000, isRepeatable: false },
  { key: 'first_ad_campaign', name: 'First Ad Campaign', description: 'Create your first advertisement', coinsAwarded: 50, isRepeatable: false },
  { key: 'profile_complete', name: 'Complete Profile', description: 'Fill out all profile information', coinsAwarded: 30, isRepeatable: false },
  { key: 'store_verified', name: 'Store Verified', description: 'Get your store verified', coinsAwarded: 200, isRepeatable: false },
  { key: 'monthly_referral', name: 'Monthly Referral Bonus', description: 'Refer a new vendor each month', coinsAwarded: 50, isRepeatable: true },
];

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create Super Admin
  console.log('👤 Creating Super Admin...');
  
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_CONFIG.email },
  });

  if (existingSuperAdmin) {
    console.log('   ⚠️  Super Admin already exists, updating password...');
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_CONFIG.password, 12);
    await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: { passwordHash },
    });
    console.log('   ✅ Super Admin password updated\n');
  } else {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_CONFIG.password, 12);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: SUPER_ADMIN_CONFIG.email,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        profile: {
          create: {
            firstName: SUPER_ADMIN_CONFIG.firstName,
            lastName: SUPER_ADMIN_CONFIG.lastName,
          },
        },
        adminPermission: {
          create: {
            role: AdminRole.SUPER_ADMIN,
            permissions: '*', // All permissions
            grantedBy: 'system',
            isActive: true,
          },
        },
      },
      include: {
        profile: true,
        adminPermission: true,
      },
    });

    console.log('   ✅ Super Admin created:');
    console.log(`      Email: ${superAdmin.email}`);
    console.log(`      Role: ${superAdmin.role}`);
    console.log(`      ID: ${superAdmin.id}\n`);
  }

  // 2. Seed System Configurations
  console.log('⚙️  Seeding system configurations...');
  
  for (const config of SYSTEM_CONFIGS) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log(`   ✅ ${SYSTEM_CONFIGS.length} system configurations seeded\n`);

  // 3. Seed Vendor Milestones
  console.log('🏆 Seeding vendor milestones...');
  
  for (const milestone of VENDOR_MILESTONES) {
    await prisma.milestone.upsert({
      where: { key: milestone.key },
      update: milestone,
      create: milestone,
    });
  }
  console.log(`   ✅ ${VENDOR_MILESTONES.length} vendor milestones seeded\n`);

  // 4. Create default categories (basic ones)
  console.log('📂 Creating default categories...');
  
  const defaultCategories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Garden', slug: 'home-garden' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
    { name: 'Toys & Games', slug: 'toys-games' },
    { name: 'Books & Stationery', slug: 'books-stationery' },
    { name: 'Automotive', slug: 'automotive' },
    { name: 'Food & Groceries', slug: 'food-groceries' },
    { name: 'Health & Wellness', slug: 'health-wellness' },
  ];

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { ...category, isActive: true },
    });
  }
  console.log(`   ✅ ${defaultCategories.length} default categories created\n`);

  console.log('✅ Database seed completed successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 SUPER ADMIN CREDENTIALS:');
  console.log(`   Email: ${SUPER_ADMIN_CONFIG.email}`);
  console.log(`   Password: ${SUPER_ADMIN_CONFIG.password}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  Please change the default password after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
