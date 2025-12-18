// backend/controllers/bulkTranslateController.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const aiTranslationService = require('../services/aiTranslation.service'); // ✅ Dùng lại service có sẵn

/**
 * Dịch tất cả products chưa có bản dịch
 */
exports.translateAllProducts = async (req, res) => {
  try {
    const { sourceLang = 'vi', targetLang = 'zh', force = false } = req.body;
    
    // Query: Tìm products chưa có bản dịch hoặc force = true
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
    
    console.log(`🔄 Starting translation for ${products.length} products...`);
    
    for (const product of products) {
      try {
        let needSave = false;
        
        // Dịch name nếu chưa có
        if (!product.name[targetLang] || force) {
          const result = await aiTranslationService.translateWithClaude(
            product.name[sourceLang], 
            sourceLang, 
            targetLang
          );
          product.name[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Name: ${product.name[sourceLang]} → ${result.translation}`);
        }
        
        // Dịch description nếu có và chưa dịch
        if (product.description?.[sourceLang] && (!product.description?.[targetLang] || force)) {
          const result = await aiTranslationService.translateWithClaude(
            product.description[sourceLang], 
            sourceLang, 
            targetLang
          );
          if (!product.description) product.description = {};
          product.description[targetLang] = result.translation;
          needSave = true;
        }
        
        // Dịch attributes (nếu có)
        if (product.attributes && product.attributes.length > 0) {
          for (const attr of product.attributes) {
            // Dịch attribute name
            if (attr.name[sourceLang] && (!attr.name[targetLang] || force)) {
              const result = await aiTranslationService.translateWithClaude(
                attr.name[sourceLang],
                sourceLang,
                targetLang
              );
              attr.name[targetLang] = result.translation;
              needSave = true;
            }
            
            // Dịch attribute options
            for (const option of attr.options) {
              if (option.label[sourceLang] && (!option.label[targetLang] || force)) {
                const result = await aiTranslationService.translateWithClaude(
                  option.label[sourceLang],
                  sourceLang,
                  targetLang
                );
                option.label[targetLang] = result.translation;
                needSave = true;
              }
            }
          }
        }
        
        if (needSave) {
          await product.save();
          translated++;
        }
        
        // Delay để tránh rate limit (Google Translate Free có rate limit)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (err) {
        failed++;
        errors.push({
          productId: product._id,
          productName: product.name[sourceLang],
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
    
    console.log(`🔄 Starting translation for ${categories.length} categories...`);
    
    for (const category of categories) {
      try {
        let needSave = false;
        
        // Dịch name
        if (!category.name[targetLang] || force) {
          const result = await aiTranslationService.translateWithClaude(
            category.name[sourceLang], 
            sourceLang, 
            targetLang
          );
          category.name[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Category: ${category.name[sourceLang]} → ${result.translation}`);
        }
        
        // Dịch description nếu có
        if (category.description?.[sourceLang] && (!category.description?.[targetLang] || force)) {
          const result = await aiTranslationService.translateWithClaude(
            category.description[sourceLang], 
            sourceLang, 
            targetLang
          );
          if (!category.description) category.description = {};
          category.description[targetLang] = result.translation;
          needSave = true;
        }
        
        if (needSave) {
          await category.save();
          translated++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (err) {
        failed++;
        errors.push({
          categoryId: category._id,
          categoryName: category.name[sourceLang],
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