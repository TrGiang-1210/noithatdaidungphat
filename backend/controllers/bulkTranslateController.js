// backend/controllers/bulkTranslateController.js - ✅ FIXED
// CHỈ DỊCH ĐƠN HÀNG TIẾNG TRUNG (zh → vi)
const Product = require('../models/Product');
const Category = require('../models/Category');
const OrderDetail = require('../models/OrderDetail');
const aiTranslationService = require('../services/aiTranslation.service');

/**
 * Helper: Lấy text an toàn từ multilingual field
 */
function getTextSafely(field, lang) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field[lang]) return field[lang];
  return '';
}

/**
 * Helper: Ensure field là object multilingual
 */
function ensureMultilingualObject(field, sourceLang = 'vi') {
  if (typeof field === 'string') {
    return { [sourceLang]: field, zh: '' };
  }
  
  if (!field || typeof field !== 'object') {
    return { [sourceLang]: '', zh: '' };
  }
  
  return {
    [sourceLang]: field[sourceLang] || '',
    zh: field.zh || ''
  };
}

/**
 * ✅ Helper: Kiểm tra xem OrderDetail có cần dịch không
 * CHỈ DỊCH các đơn đặt bằng TIẾNG TRUNG (zh)
 */
function needsTranslation(orderDetail, targetLang = 'zh') {
  // 1. Kiểm tra name
  if (typeof orderDetail.name === 'object') {
    // Nếu name đã là object {vi, zh}
    const hasSource = orderDetail.name.zh && orderDetail.name.zh.trim();
    const hasTarget = orderDetail.name.vi && orderDetail.name.vi.trim();
    
    // ✅ CHỈ DỊCH nếu: có tiếng Trung, CHƯA có tiếng Việt
    if (hasSource && !hasTarget) {
      return true;
    }
  }
  
  // 2. Kiểm tra selectedAttributes
  if (orderDetail.selectedAttributes && orderDetail.selectedAttributes.size > 0) {
    for (const [key, value] of orderDetail.selectedAttributes.entries()) {
      if (typeof value === 'object') {
        const hasSource = value.zh && value.zh.trim();
        const hasTarget = value.vi && value.vi.trim();
        
        // ✅ Có ít nhất 1 attribute cần dịch
        if (hasSource && !hasTarget) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Dịch tất cả products chưa có bản dịch
 */
exports.translateAllProducts = async (req, res) => {
  try {
    const { sourceLang = 'vi', targetLang = 'zh', force = false } = req.body;
    
    const query = force 
      ? {} 
      : { [`name.${targetLang}`]: { $in: ['', null] } };
    
    const products = await Product.find(query);
    
    if (products.length === 0) {
      return res.json({
        success: true,
        message: 'Không có sản phẩm nào cần dịch',
        translated: 0,
        total: 0
      });
    }
    
    let translated = 0;
    let failed = 0;
    const errors = [];
    
    console.log(`📄 Starting translation for ${products.length} products...`);
    
    for (const product of products) {
      try {
        let needSave = false;
        
        product.name = ensureMultilingualObject(product.name, sourceLang);
        const sourceName = product.name[sourceLang];
        
        if (!sourceName) {
          console.warn(`⚠️  Product ${product._id} has no name in ${sourceLang}, skipping...`);
          continue;
        }
        
        if (!product.name[targetLang] || force) {
          const result = await aiTranslationService.translateWithClaude(
            sourceName, 
            sourceLang, 
            targetLang
          );
          
          product.name[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Name: ${sourceName} → ${result.translation}`);
        }
        
        product.description = ensureMultilingualObject(product.description, sourceLang);
        const sourceDesc = product.description[sourceLang];
        
        if (sourceDesc && sourceDesc.trim() && (!product.description[targetLang] || force)) {
          const result = await aiTranslationService.translateWithClaude(
            sourceDesc, 
            sourceLang, 
            targetLang
          );
          
          product.description[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Description translated`);
        }
        
        if (product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0) {
          for (const attr of product.attributes) {
            attr.name = ensureMultilingualObject(attr.name, sourceLang);
            const attrName = attr.name[sourceLang];
            
            if (attrName && attrName.trim() && (!attr.name[targetLang] || force)) {
              const result = await aiTranslationService.translateWithClaude(
                attrName,
                sourceLang,
                targetLang
              );
              
              attr.name[targetLang] = result.translation;
              needSave = true;
              console.log(`  ✅ Attr: ${attrName} → ${result.translation}`);
            }
            
            if (attr.options && Array.isArray(attr.options) && attr.options.length > 0) {
              for (const option of attr.options) {
                option.label = ensureMultilingualObject(option.label, sourceLang);
                const optionLabel = option.label[sourceLang];
                
                if (optionLabel && optionLabel.trim() && (!option.label[targetLang] || force)) {
                  const result = await aiTranslationService.translateWithClaude(
                    optionLabel,
                    sourceLang,
                    targetLang
                  );
                  
                  option.label[targetLang] = result.translation;
                  needSave = true;
                  console.log(`    ✅ Option: ${optionLabel} → ${result.translation}`);
                }
              }
            }
          }
        }
        
        if (needSave) {
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
          translated++;
          console.log(`✅ Saved product ${product._id}\n`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (err) {
        failed++;
        const productName = getTextSafely(product.name, sourceLang) || 'Unknown';
        errors.push({
          productId: product._id,
          productName: productName,
          error: err.message
        });
        console.error(`❌ Failed to translate product ${product._id}:`, err.message);
      }
    }
    
    console.log(`✅ Translation completed: ${translated} success, ${failed} failed`);
    
    res.json({
      success: true,
      message: `Đã dịch ${translated}/${products.length} sản phẩm`,
      translated,
      failed,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in translateAllProducts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Dịch tất cả categories chưa có bản dịch
 */
exports.translateAllCategories = async (req, res) => {
  try {
    const { sourceLang = 'vi', targetLang = 'zh', force = false } = req.body;
    
    const query = force 
      ? {} 
      : { [`name.${targetLang}`]: { $in: ['', null] } };
    
    const categories = await Category.find(query);
    
    if (categories.length === 0) {
      return res.json({
        success: true,
        message: 'Không có danh mục nào cần dịch',
        translated: 0,
        total: 0
      });
    }
    
    let translated = 0;
    let failed = 0;
    const errors = [];
    
    console.log(`📄 Starting translation for ${categories.length} categories...`);
    
    for (const category of categories) {
      try {
        let needSave = false;
        
        category.name = ensureMultilingualObject(category.name, sourceLang);
        const sourceName = category.name[sourceLang];
        
        if (!sourceName) {
          console.warn(`⚠️  Category ${category._id} has no name in ${sourceLang}, skipping...`);
          continue;
        }
        
        if (!category.name[targetLang] || force) {
          const result = await aiTranslationService.translateWithClaude(
            sourceName, 
            sourceLang, 
            targetLang
          );
          
          category.name[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Category: ${sourceName} → ${result.translation}`);
        }
        
        category.description = ensureMultilingualObject(category.description, sourceLang);
        const sourceDesc = category.description[sourceLang];
        
        if (sourceDesc && sourceDesc.trim() && (!category.description[targetLang] || force)) {
          const result = await aiTranslationService.translateWithClaude(
            sourceDesc, 
            sourceLang, 
            targetLang
          );
          
          category.description[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Description translated`);
        }
        
        if (needSave) {
          await Category.updateOne(
            { _id: category._id },
            { 
              $set: { 
                name: category.name,
                description: category.description
              } 
            }
          );
          translated++;
          console.log(`✅ Saved category ${category._id}\n`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (err) {
        failed++;
        const categoryName = getTextSafely(category.name, sourceLang) || 'Unknown';
        errors.push({
          categoryId: category._id,
          categoryName: categoryName,
          error: err.message
        });
        console.error(`❌ Failed to translate category ${category._id}:`, err.message);
      }
    }
    
    console.log(`✅ Translation completed: ${translated} success, ${failed} failed`);
    
    res.json({
      success: true,
      message: `Đã dịch ${translated}/${categories.length} danh mục`,
      translated,
      failed,
      total: categories.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in translateAllCategories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ FIXED: CHỈ DỊCH ĐƠN HÀNG TIẾNG TRUNG (zh → vi)
exports.translateAllOrders = async (req, res) => {
  try {
    const { sourceLang = 'zh', targetLang = 'vi', force = false } = req.body;
    
    console.log(`\n🔄 Starting order translation: ${sourceLang} → ${targetLang}`);
    console.log(`📦 Force mode: ${force}\n`);
    
    // ✅ LẤY TẤT CẢ ORDER DETAILS
    const allOrderDetails = await OrderDetail.find({});
    
    // ✅ LỌC CHỈ CÁC ĐƠN CẦN DỊCH
    const orderDetailsToTranslate = allOrderDetails.filter(detail => {
      if (force) return true; // Force mode: dịch tất cả
      return needsTranslation(detail, targetLang);
    });
    
    console.log(`📊 Total orders in DB: ${allOrderDetails.length}`);
    console.log(`📊 Orders need translation: ${orderDetailsToTranslate.length}\n`);
    
    if (orderDetailsToTranslate.length === 0) {
      return res.json({
        success: true,
        message: 'Không có đơn hàng nào cần dịch',
        translated: 0,
        total: 0
      });
    }
    
    let translated = 0;
    let failed = 0;
    const errors = [];
    
    for (const detail of orderDetailsToTranslate) {
      try {
        let needSave = false;
        
        console.log(`\n📦 Processing OrderDetail: ${detail._id}`);
        
        // ✅ DỊCH NAME (nếu là object và có zh nhưng chưa có vi)
        if (typeof detail.name === 'object') {
          const sourceName = detail.name[sourceLang];
          const targetName = detail.name[targetLang];
          
          console.log(`   Name (${sourceLang}): "${sourceName}"`);
          console.log(`   Name (${targetLang}): "${targetName || 'MISSING'}"`);
          
          if (sourceName && sourceName.trim() && (!targetName || force)) {
            const result = await aiTranslationService.translateWithClaude(
              sourceName, 
              sourceLang, 
              targetLang
            );
            
            detail.name[targetLang] = result.translation;
            needSave = true;
            console.log(`   ✅ Translated: ${sourceName} → ${result.translation}`);
          }
        } else if (typeof detail.name === 'string') {
          console.log(`   ⚠️  Name is string (legacy format): "${detail.name}"`);
          // Bỏ qua string (đơn hàng cũ tiếng Việt)
        }
        
        // ✅ DỊCH SELECTED ATTRIBUTES (nếu là object và có zh nhưng chưa có vi)
        if (detail.selectedAttributes && detail.selectedAttributes.size > 0) {
          console.log(`   📋 Processing ${detail.selectedAttributes.size} attributes...`);
          
          for (const [attrKey, attrValue] of detail.selectedAttributes.entries()) {
            if (typeof attrValue === 'object' && attrValue !== null) {
              const sourceValue = attrValue[sourceLang];
              const targetValue = attrValue[targetLang];
              
              console.log(`      "${attrKey}" (${sourceLang}): "${sourceValue}"`);
              console.log(`      "${attrKey}" (${targetLang}): "${targetValue || 'MISSING'}"`);
              
              if (sourceValue && sourceValue.trim() && (!targetValue || force)) {
                const result = await aiTranslationService.translateWithClaude(
                  sourceValue,
                  sourceLang,
                  targetLang
                );
                
                attrValue[targetLang] = result.translation;
                detail.selectedAttributes.set(attrKey, attrValue);
                needSave = true;
                console.log(`      ✅ Translated: ${sourceValue} → ${result.translation}`);
              }
            } else if (typeof attrValue === 'string') {
              console.log(`      ⚠️  "${attrKey}" is string (legacy): "${attrValue}"`);
              // Bỏ qua string (đơn hàng cũ tiếng Việt)
            }
          }
        }
        
        // ✅ LƯU VÀO DB
        if (needSave) {
          await OrderDetail.updateOne(
            { _id: detail._id },
            { 
              $set: { 
                name: detail.name,
                selectedAttributes: detail.selectedAttributes
              } 
            }
          );
          translated++;
          console.log(`   ✅ Saved OrderDetail ${detail._id}`);
        } else {
          console.log(`   ℹ️  No changes needed for OrderDetail ${detail._id}`);
        }
        
        // ✅ DELAY để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (err) {
        failed++;
        const itemName = getTextSafely(detail.name, sourceLang) || 'Unknown';
        errors.push({
          orderDetailId: detail._id,
          itemName: itemName,
          error: err.message
        });
        console.error(`❌ Failed to translate order detail ${detail._id}:`, err.message);
      }
    }
    
    console.log(`\n✅ Translation completed: ${translated} success, ${failed} failed\n`);
    
    res.json({
      success: true,
      message: `Đã dịch ${translated}/${orderDetailsToTranslate.length} mục đơn hàng`,
      translated,
      failed,
      total: orderDetailsToTranslate.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in translateAllOrders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * ✅ FIXED: Thống kê ĐÚNG số đơn hàng cần dịch
 */
exports.getTranslationStats = async (req, res) => {
  try {
    const { targetLang = 'zh' } = req.query;
    
    // Đếm products
    const totalProducts = await Product.countDocuments({});
    const translatedProducts = await Product.countDocuments({
      [`name.${targetLang}`]: { $exists: true, $ne: '' }
    });
    
    // Đếm categories
    const totalCategories = await Category.countDocuments({});
    const translatedCategories = await Category.countDocuments({
      [`name.${targetLang}`]: { $exists: true, $ne: '' }
    });
    
    // ✅ FIXED: Đếm orders ĐÚNG CÁCH
    const allOrderDetails = await OrderDetail.find({});
    
    // Chỉ đếm các đơn có format multilingual (object)
    const multilingualOrders = allOrderDetails.filter(detail => 
      typeof detail.name === 'object'
    );
    
    // Đếm đơn đã dịch (có cả vi và zh)
    const translatedOrders = multilingualOrders.filter(detail => {
      if (typeof detail.name !== 'object') return false;
      
      const hasVi = detail.name.vi && detail.name.vi.trim();
      const hasZh = detail.name.zh && detail.name.zh.trim();
      
      return hasVi && hasZh; // Đã có cả 2 ngôn ngữ
    });
    
    // Đếm đơn chưa dịch (chỉ có zh, chưa có vi)
    const pendingOrders = multilingualOrders.filter(detail => {
      if (typeof detail.name !== 'object') return false;
      
      const hasVi = detail.name.vi && detail.name.vi.trim();
      const hasZh = detail.name.zh && detail.name.zh.trim();
      
      return hasZh && !hasVi; // Có zh nhưng chưa có vi
    });
    
    console.log(`📊 Order Stats:`);
    console.log(`   Total in DB: ${allOrderDetails.length}`);
    console.log(`   Multilingual format: ${multilingualOrders.length}`);
    console.log(`   Translated (vi+zh): ${translatedOrders.length}`);
    console.log(`   Pending (zh only): ${pendingOrders.length}`);
    
    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          translated: translatedProducts,
          pending: totalProducts - translatedProducts,
          percentage: totalProducts > 0 ? Math.round((translatedProducts / totalProducts) * 100) : 0
        },
        categories: {
          total: totalCategories,
          translated: translatedCategories,
          pending: totalCategories - translatedCategories,
          percentage: totalCategories > 0 ? Math.round((translatedCategories / totalCategories) * 100) : 0
        },
        orders: {
          total: multilingualOrders.length, // Chỉ đếm đơn multilingual
          translated: translatedOrders.length,
          pending: pendingOrders.length,
          percentage: multilingualOrders.length > 0 
            ? Math.round((translatedOrders.length / multilingualOrders.length) * 100) 
            : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error in getTranslationStats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};