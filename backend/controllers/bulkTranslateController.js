// backend/controllers/bulkTranslateController.js - ✅ WITH ORDERS
const Product = require('../models/Product');
const Category = require('../models/Category');
const OrderDetail = require('../models/OrderDetail'); // ✅ THÊM
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

// ✅ NEW: Dịch tất cả order details
exports.translateAllOrders = async (req, res) => {
  try {
    const { sourceLang = 'vi', targetLang = 'zh', force = false } = req.body;
    
    // Query: Tìm order details chưa có bản dịch
    const query = force 
      ? {} 
      : { [`name.${targetLang}`]: { $in: ['', null] } };
    
    const orderDetails = await OrderDetail.find(query);
    
    if (orderDetails.length === 0) {
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
    
    console.log(`📦 Starting translation for ${orderDetails.length} order items...`);
    
    for (const detail of orderDetails) {
      try {
        let needSave = false;
        
        // Dịch name
        detail.name = ensureMultilingualObject(detail.name, sourceLang);
        const sourceName = detail.name[sourceLang];
        
        if (!sourceName) {
          console.warn(`⚠️  Order detail ${detail._id} has no name in ${sourceLang}, skipping...`);
          continue;
        }
        
        if (!detail.name[targetLang] || force) {
          const result = await aiTranslationService.translateWithClaude(
            sourceName, 
            sourceLang, 
            targetLang
          );
          
          detail.name[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Name: ${sourceName} → ${result.translation}`);
        }
        
        // Dịch selectedAttributes (Map)
        if (detail.selectedAttributes && detail.selectedAttributes.size > 0) {
          for (const [attrKey, attrValue] of detail.selectedAttributes.entries()) {
            // Ensure attrValue là multilingual object
            const normalizedValue = ensureMultilingualObject(attrValue, sourceLang);
            const sourceAttrValue = normalizedValue[sourceLang];
            
            if (sourceAttrValue && sourceAttrValue.trim() && (!normalizedValue[targetLang] || force)) {
              const result = await aiTranslationService.translateWithClaude(
                sourceAttrValue,
                sourceLang,
                targetLang
              );
              
              normalizedValue[targetLang] = result.translation;
              detail.selectedAttributes.set(attrKey, normalizedValue);
              needSave = true;
              console.log(`  ✅ Attr "${attrKey}": ${sourceAttrValue} → ${result.translation}`);
            } else {
              // Cập nhật lại giá trị đã normalize
              detail.selectedAttributes.set(attrKey, normalizedValue);
            }
          }
        }
        
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
          console.log(`✅ Saved order detail ${detail._id}\n`);
        }
        
        // Delay để tránh rate limit
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
    
    console.log(`✅ Translation completed: ${translated} success, ${failed} failed`);
    
    res.json({
      success: true,
      message: `Đã dịch ${translated}/${orderDetails.length} mục đơn hàng`,
      translated,
      failed,
      total: orderDetails.length,
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
 * Lấy thống kê translation
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
    
    // ✅ Đếm order details
    const totalOrders = await OrderDetail.countDocuments({});
    const translatedOrders = await OrderDetail.countDocuments({
      [`name.${targetLang}`]: { $exists: true, $ne: '' }
    });
    
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
        // ✅ NEW
        orders: {
          total: totalOrders,
          translated: translatedOrders,
          pending: totalOrders - translatedOrders,
          percentage: totalOrders > 0 ? Math.round((translatedOrders / totalOrders) * 100) : 0
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