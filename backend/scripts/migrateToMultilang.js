// backend/scripts/migrateToMultilang.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

/**
 * Helper: Normalize field to multilingual format
 */
function normalizeField(field, fieldName = 'field') {
  // Nếu là string → convert sang {vi: string, zh: ''}
  if (typeof field === 'string') {
    return {
      vi: field,
      zh: ''
    };
  }
  
  // Nếu là object nhưng thiếu vi hoặc zh
  if (typeof field === 'object' && field !== null) {
    return {
      vi: field.vi || field.en || field.default || '',
      zh: field.zh || ''
    };
  }
  
  // Nếu null/undefined → default object
  return {
    vi: '',
    zh: ''
  };
}

/**
 * Check if field needs migration
 */
function needsMigration(field) {
  // String → cần migrate
  if (typeof field === 'string') {
    return true;
  }
  
  // Object nhưng thiếu vi hoặc zh → cần migrate
  if (typeof field === 'object' && field !== null) {
    if (!field.hasOwnProperty('vi') || !field.hasOwnProperty('zh')) {
      return true;
    }
  }
  
  // null/undefined → cần migrate
  if (!field) {
    return true;
  }
  
  return false;
}

async function migrateProducts() {
  try {
    console.log('📄 Migrating Products to multilingual format...\n');
    
    const products = await Product.find({});
    let migrated = 0;
    let skipped = 0;
    
    for (const product of products) {
      let needSave = false;
      const productName = product.name?.vi || product.name || product._id;
      
      // Migrate name
      if (needsMigration(product.name)) {
        const oldName = product.name;
        product.name = normalizeField(product.name, 'name');
        console.log(`📝 Name: "${oldName}" → {vi: "${product.name.vi}", zh: "${product.name.zh}"}`);
        needSave = true;
      }
      
      // Migrate description
      if (needsMigration(product.description)) {
        product.description = normalizeField(product.description, 'description');
        needSave = true;
      }
      
      // Migrate attributes
      if (product.attributes && Array.isArray(product.attributes)) {
        product.attributes.forEach((attr, attrIdx) => {
          // Migrate attribute name
          if (needsMigration(attr.name)) {
            const oldAttrName = attr.name;
            attr.name = normalizeField(attr.name, 'attribute.name');
            console.log(`  └─ Attr[${attrIdx}]: "${oldAttrName}" → {vi: "${attr.name.vi}", zh: ""}`);
            needSave = true;
          }
          
          // Migrate options
          if (attr.options && Array.isArray(attr.options)) {
            attr.options.forEach((option, optIdx) => {
              if (needsMigration(option.label)) {
                const oldLabel = option.label;
                option.label = normalizeField(option.label, 'option.label');
                console.log(`     └─ Option[${optIdx}]: "${oldLabel}" → {vi: "${option.label.vi}", zh: ""}`);
                needSave = true;
              }
            });
          }
        });
      }
      
      if (needSave) {
        try {
          // ✅ QUAN TRỌNG: Sử dụng updateOne thay vì save() để tránh validation issues
          await Product.updateOne(
            { _id: product._id },
            { 
              $set: { 
                name: product.name,
                description: product.description,
                attributes: product.attributes
              } 
            }
          );
          migrated++;
          console.log(`✅ Migrated: ${productName}\n`);
        } catch (saveError) {
          console.error(`❌ Error saving product ${product._id}:`, saveError.message);
        }
      } else {
        skipped++;
        console.log(`⭐️ Skipped (already migrated): ${productName}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Products Migration Complete`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${products.length}`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error migrating products:', error);
    throw error;
  }
}

async function migrateCategories() {
  try {
    console.log('📄 Migrating Categories to multilingual format...\n');
    
    const categories = await Category.find({});
    let migrated = 0;
    let skipped = 0;
    
    for (const category of categories) {
      let needSave = false;
      const categoryName = category.name?.vi || category.name || category._id;
      
      // Migrate name
      if (needsMigration(category.name)) {
        const oldName = category.name;
        category.name = normalizeField(category.name, 'name');
        console.log(`📝 Name: "${oldName}" → {vi: "${category.name.vi}", zh: "${category.name.zh}"}`);
        needSave = true;
      }
      
      // Migrate description
      if (needsMigration(category.description)) {
        category.description = normalizeField(category.description, 'description');
        needSave = true;
      }
      
      if (needSave) {
        try {
          // ✅ QUAN TRỌNG: Sử dụng updateOne
          await Category.updateOne(
            { _id: category._id },
            { 
              $set: { 
                name: category.name,
                description: category.description
              } 
            }
          );
          migrated++;
          console.log(`✅ Migrated: ${categoryName}\n`);
        } catch (saveError) {
          console.error(`❌ Error saving category ${category._id}:`, saveError.message);
        }
      } else {
        skipped++;
        console.log(`⭐️ Skipped (already migrated): ${categoryName}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Categories Migration Complete`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${categories.length}`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error migrating categories:', error);
    throw error;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('🔍 Verifying migration results...\n');
  
  // Check products - ✅ FIX: Kiểm tra đúng cấu trúc
  const productsWithIssues = await Product.find({}).lean();
  const problemProducts = productsWithIssues.filter(p => {
    return typeof p.name !== 'object' || 
           !p.name.hasOwnProperty('vi') || 
           !p.name.hasOwnProperty('zh') ||
           !p.name.vi;
  });
  
  // Check categories
  const categoriesWithIssues = await Category.find({}).lean();
  const problemCategories = categoriesWithIssues.filter(c => {
    return typeof c.name !== 'object' || 
           !c.name.hasOwnProperty('vi') || 
           !c.name.hasOwnProperty('zh') ||
           !c.name.vi;
  });
  
  if (problemProducts.length > 0) {
    console.log(`⚠️  Found ${problemProducts.length} products with issues:`);
    problemProducts.slice(0, 5).forEach(p => {
      console.log(`   - ${p._id}: name =`, JSON.stringify(p.name));
    });
    if (problemProducts.length > 5) {
      console.log(`   ... and ${problemProducts.length - 5} more`);
    }
    console.log('');
  } else {
    console.log('✅ All products migrated successfully!');
  }
  
  if (problemCategories.length > 0) {
    console.log(`⚠️  Found ${problemCategories.length} categories with issues:`);
    problemCategories.slice(0, 5).forEach(c => {
      console.log(`   - ${c._id}: name =`, JSON.stringify(c.name));
    });
    if (problemCategories.length > 5) {
      console.log(`   ... and ${problemCategories.length - 5} more`);
    }
    console.log('');
  } else {
    console.log('✅ All categories migrated successfully!');
  }
  
  console.log('');
}

async function run() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    await migrateProducts();
    await migrateCategories();
    await verifyMigration();
    
    console.log('🎉 All migrations completed!\n');
    console.log('📋 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Go to Admin Panel → Database Translation');
    console.log('   3. Click "Làm mới" to refresh stats');
    console.log('   4. Click "Dịch X sản phẩm chưa dịch" to translate\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

run();