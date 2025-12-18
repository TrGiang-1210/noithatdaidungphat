// backend/scripts/migrateToMultilang.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

async function migrateProducts() {
  try {
    console.log('🔄 Migrating Products to multilingual format...');
    
    const products = await Product.find({});
    
    for (const product of products) {
      // Nếu name chưa phải object, convert nó
      if (typeof product.name === 'string') {
        const oldName = product.name;
        const oldDesc = product.description || '';
        
        product.name = {
          vi: oldName,
          zh: '' // Để trống, sẽ dịch sau
        };
        
        product.description = {
          vi: oldDesc,
          zh: ''
        };
        
        await product.save();
        console.log(`✅ Migrated product: ${oldName}`);
      }
    }
    
    console.log(`✅ Migrated ${products.length} products\n`);
  } catch (error) {
    console.error('❌ Error migrating products:', error);
  }
}

async function migrateCategories() {
  try {
    console.log('🔄 Migrating Categories to multilingual format...');
    
    const categories = await Category.find({});
    
    for (const category of categories) {
      if (typeof category.name === 'string') {
        const oldName = category.name;
        
        category.name = {
          vi: oldName,
          zh: ''
        };
        
        if (category.description && typeof category.description === 'string') {
          const oldDesc = category.description;
          category.description = {
            vi: oldDesc,
            zh: ''
          };
        }
        
        await category.save();
        console.log(`✅ Migrated category: ${oldName}`);
      }
    }
    
    console.log(`✅ Migrated ${categories.length} categories\n`);
  } catch (error) {
    console.error('❌ Error migrating categories:', error);
  }
}

async function run() {
  try {
    console.log('📌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    await migrateProducts();
    await migrateCategories();
    
    console.log('🎉 Migration completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Use AI translation API to fill zh fields');
    console.log('   2. Update frontend to use language-aware data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

run();