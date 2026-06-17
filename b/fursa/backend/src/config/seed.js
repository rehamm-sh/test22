// src/config/seed.js
// Run with: npm run db:seed
// Creates the default admin account and job categories

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

const seed = async () => {
  console.log('🌱 Starting database seed...\n');

  try {
    // ─── 1. Create Admin User ───────────────────────────────
    const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@fursa.sy';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName     = process.env.ADMIN_NAME     || 'مدير النظام';

    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [adminEmail]
    );

    if (existing.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, 'admin')`,
        [adminName, adminEmail, hashedPassword]
      );
      console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
      console.log('⚠️  Change the admin password after first login!\n');
    } else {
      console.log('⏭️  Admin already exists, skipping.\n');
    }

    // ─── 2. Create Job Categories ────────────────────────────
    const categories = [
      { name: 'sales_marketing',    name_ar: 'المبيعات والتسويق',     icon: 'trending-up' },
      { name: 'management',         name_ar: 'الإدارة',                icon: 'briefcase' },
      { name: 'engineering',        name_ar: 'الهندسة',                icon: 'settings' },
      { name: 'accounting_finance', name_ar: 'المحاسبة والمالية',      icon: 'dollar-sign' },
      { name: 'education_training', name_ar: 'التعليم والتدريب',       icon: 'book-open' },
      { name: 'healthcare',         name_ar: 'الرعاية الصحية',         icon: 'heart' },
      { name: 'information_tech',   name_ar: 'تكنولوجيا المعلومات',    icon: 'monitor' },
      { name: 'arts_design',        name_ar: 'الفنون والتصميم',        icon: 'pen-tool' },
      { name: 'legal',              name_ar: 'القانون',                 icon: 'shield' },
      { name: 'hospitality',        name_ar: 'الضيافة والسياحة',       icon: 'coffee' },
      { name: 'construction',       name_ar: 'البناء والتشييد',        icon: 'home' },
      { name: 'transportation',     name_ar: 'النقل والخدمات اللوجستية', icon: 'truck' },
    ];

    let created = 0;
    for (const cat of categories) {
      const res = await pool.query(
        'SELECT id FROM categories WHERE name = $1', [cat.name]
      );
      if (res.rows.length === 0) {
        await pool.query(
          `INSERT INTO categories (name, name_ar, icon)
           VALUES ($1, $2, $3)`,
          [cat.name, cat.name_ar, cat.icon]
        );
        created++;
      }
    }
    console.log(`✅ Categories: ${created} created (${categories.length - created} already existed)`);

    console.log('\n🎉 Seed completed!\n');
    console.log('═══════════════════════════════════════');
    console.log('  Admin Login:');
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

seed();
