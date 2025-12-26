// backend/scripts/migrateToMultilang.js - ✅ WITH ORDERS MIGRATION
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const OrderDetail = require('../models/OrderDetail'); // ✅ THÊM
require('dotenv').config();

/**
 * Helper: Normalize field to multilingual format
 */
function normalizeField(field, fieldName = 'field') {
  if (typeof field === 'string') {
    return { vi: field, zh: '' };
  }
  
  if (typeof field === 'object' && field !== null) {
    return {
      vi: field.vi || field.en || field.default || '',
      zh: field.zh || ''
    };
  }
  
  return { vi: '', zh: '' };
}

/**
 * Check if field needs migration
 */
function needsMigration(field) {
  if (typeof field === 'string') return true;
  
  if (typeof field === 'object' && field !== null) {
    if (!field.hasOwnProperty('vi') || !field.hasOwnProperty('zh')) {
      return true;
    }
  }
  
  if (!field) return true;
  
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
      
      if (needsMigration(product.name)) {
        const oldName = product.name;
        product.name = normalizeField(product.name, 'name');
        console.log(`📝 Name: "${oldName}" → {vi: "${product.name.vi}", zh: "${product.name.zh}"}`);
        needSave = true;
      }
      
      if (needsMigration(product.description)) {
        product.description = normalizeField(product.description, 'description');
        needSave = true;
      }
      
      if (product.attributes && Array.isArray(product.attributes)) {
        product.attributes.forEach((attr, attrIdx) => {
          if (needsMigration(attr.name)) {
            const oldAttrName = attr.name;
            attr.name = normalizeField(attr.name, 'attribute.name');
            console.log(`  └─ Attr[${attrIdx}]: "${oldAttrName}" → {vi: "${attr.name.vi}", zh: ""}`);
            needSave = true;
          }
          
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
      
      if (needsMigration(category.name)) {
        const oldName = category.name;
        category.name = normalizeField(category.name, 'name');
        console.log(`📝 Name: "${oldName}" → {vi: "${category.name.vi}", zh: "${category.name.zh}"}`);
        needSave = true;
      }
      
      if (needsMigration(category.description)) {
        category.description = normalizeField(category.description, 'description');
        needSave = true;
      }
      
      if (needSave) {
        try {
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

// ✅ NEW: Migrate OrderDetails
async function migrateOrders() {
  try {
    console.log('📦 Migrating Order Details to multilingual format...\n');
    
    const orderDetails = await OrderDetail.find({});
    let migrated = 0;
    let skipped = 0;
    
    for (const detail of orderDetails) {
      let needSave = false;
      
      // Migrate name
      if (needsMigration(detail.name)) {
        const oldName = detail.name;
        detail.name = normalizeField(detail.name, 'name');
        console.log(`📝 Order Item: "${oldName}" → {vi: "${detail.name.vi}", zh: "${detail.name.zh}"}`);
        needSave = true;
      }
      
      // Migrate selectedAttributes (Map)
      if (detail.selectedAttributes && detail.selectedAttributes.size > 0) {
        for (const [key, value] of detail.selectedAttributes.entries()) {
          if (needsMigration(value)) {
            const oldValue = value;
            detail.selectedAttributes.set(key, normalizeField(value));
            console.log(`  └─ Attribute "${key}": "${oldValue}" → {vi: "${detail.selectedAttributes.get(key).vi}", zh: ""}`);
            needSave = true;
          }
        }
      }
      
      if (needSave) {
        try {
          await OrderDetail.updateOne(
            { _id: detail._id },
            { 
              $set: { 
                name: detail.name,
                selectedAttributes: detail.selectedAttributes
              } 
            }
          );
          migrated++;
          console.log(`✅ Migrated order item ${detail._id}\n`);
        } catch (saveError) {
          console.error(`❌ Error saving order detail ${detail._id}:`, saveError.message);
        }
      } else {
        skipped++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Order Details Migration Complete`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${orderDetails.length}`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error migrating order details:', error);
    throw error;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('🔍 Verifying migration results...\n');
  
  // Check products
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
  
  // ✅ Check order details
  const orderDetailsWithIssues = await OrderDetail.find({}).lean();
  const problemOrderDetails = orderDetailsWithIssues.filter(od => {
    return typeof od.name !== 'object' || 
           !od.name.hasOwnProperty('vi') || 
           !od.name.hasOwnProperty('zh') ||
           !od.name.vi;
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
  
  // ✅ NEW
  if (problemOrderDetails.length > 0) {
    console.log(`⚠️  Found ${problemOrderDetails.length} order details with issues:`);
    problemOrderDetails.slice(0, 5).forEach(od => {
      console.log(`   - ${od._id}: name =`, JSON.stringify(od.name));
    });
    if (problemOrderDetails.length > 5) {
      console.log(`   ... and ${problemOrderDetails.length - 5} more`);
    }
    console.log('');
  } else {
    console.log('✅ All order details migrated successfully!');
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
    await migrateOrders(); // ✅ THÊM
    await verifyMigration();
    
    console.log('🎉 All migrations completed!\n');
    console.log('📋 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Go to Admin Panel → Database Translation');
    console.log('   3. Click "Làm mới" to refresh stats');
    console.log('   4. Click "Dịch X items chưa dịch" to translate\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

run();