// backend/controllers/bulkTranslateController.js - ✅ UPDATED WITH POSTS
const Product = require('../models/Product');
const Category = require('../models/Category');
const OrderDetail = require('../models/OrderDetail');
const Post = require('../models/Post'); // ✅ NEW
const PostCategory = require('../models/PostCategory'); // ✅ NEW
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
 * Helper: Kiểm tra xem OrderDetail có cần dịch không
 */
function needsTranslation(orderDetail, targetLang = 'zh') {
  if (typeof orderDetail.name === 'object') {
    const hasSource = orderDetail.name.zh && orderDetail.name.zh.trim();
    const hasTarget = orderDetail.name.vi && orderDetail.name.vi.trim();
    if (hasSource && !hasTarget) {
      return true;
    }
  }
  
  if (orderDetail.selectedAttributes && orderDetail.selectedAttributes.size > 0) {
    for (const [key, value] of orderDetail.selectedAttributes.entries()) {
      if (typeof value === 'object') {
        const hasSource = value.zh && value.zh.trim();
        const hasTarget = value.vi && value.vi.trim();
        if (hasSource && !hasTarget) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// ==================== PRODUCTS ====================
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

// ==================== CATEGORIES ====================
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

// ==================== ORDERS ====================
exports.translateAllOrders = async (req, res) => {
  try {
    const { sourceLang = 'zh', targetLang = 'vi', force = false } = req.body;
    
    console.log(`\n📄 Starting order translation: ${sourceLang} → ${targetLang}`);
    console.log(`📦 Force mode: ${force}\n`);
    
    const allOrderDetails = await OrderDetail.find({});
    const orderDetailsToTranslate = allOrderDetails.filter(detail => {
      if (force) return true;
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
        }
        
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
          console.log(`   ✅ Saved OrderDetail ${detail._id}`);
        }
        
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

// ==================== POSTS ✅ NEW ====================
exports.translateAllPosts = async (req, res) => {
  try {
    const { sourceLang = 'vi', targetLang = 'zh', force = false } = req.body;
    
    const query = force 
      ? {} 
      : { [`title.${targetLang}`]: { $in: ['', null] } };
    
    const posts = await Post.find(query);
    
    if (posts.length === 0) {
      return res.json({
        success: true,
        message: 'Không có bài viết nào cần dịch',
        translated: 0,
        total: 0
      });
    }
    
    let translated = 0;
    let failed = 0;
    const errors = [];
    
    console.log(`📄 Starting translation for ${posts.length} posts...`);
    
    for (const post of posts) {
      try {
        let needSave = false;
        
        // Dịch title
        post.title = ensureMultilingualObject(post.title, sourceLang);
        const sourceTitle = post.title[sourceLang];
        
        if (!sourceTitle) {
          console.warn(`⚠️  Post ${post._id} has no title in ${sourceLang}, skipping...`);
          continue;
        }
        
        if (!post.title[targetLang] || force) {
          const result = await aiTranslationService.translateWithClaude(
            sourceTitle, 
            sourceLang, 
            targetLang
          );
          
          post.title[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Title: ${sourceTitle} → ${result.translation}`);
        }
        
        // Dịch description
        post.description = ensureMultilingualObject(post.description, sourceLang);
        const sourceDesc = post.description[sourceLang];
        
        if (sourceDesc && sourceDesc.trim() && (!post.description[targetLang] || force)) {
          const result = await aiTranslationService.translateWithClaude(
            sourceDesc, 
            sourceLang, 
            targetLang
          );
          
          post.description[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Description translated`);
        }
        
        // Dịch content
        post.content = ensureMultilingualObject(post.content, sourceLang);
        const sourceContent = post.content[sourceLang];
        
        if (sourceContent && sourceContent.trim() && (!post.content[targetLang] || force)) {
          const result = await aiTranslationService.translateWithClaude(
            sourceContent, 
            sourceLang, 
            targetLang
          );
          
          post.content[targetLang] = result.translation;
          needSave = true;
          console.log(`✅ Content translated`);
        }
        
        // Dịch meta_title
        post.meta_title = ensureMultilingualObject(post.meta_title, sourceLang);
        const sourceMetaTitle = post.meta_title[sourceLang];
        
        if (sourceMetaTitle && sourceMetaTitle.trim() && (!post.meta_title[targetLang] || force)) {
          const result = await aiTranslationService.translateWithClaude(
            sourceMetaTitle, 
            sourceLang, 
            targetLang
          );
          
          post.meta_title[targetLang] = result.translation;
          needSave = true;
        }
        
        // Dịch meta_description
        post.meta_description = ensureMultilingualObject(post.meta_description, sourceLang);
        const sourceMetaDesc = post.meta_description[sourceLang];
        
        if (sourceMetaDesc && sourceMetaDesc.trim() && (!post.meta_description[targetLang] || force)) {
          const result = await aiTranslationService.translateWithClaude(
            sourceMetaDesc, 
            sourceLang, 
            targetLang
          );
          
          post.meta_description[targetLang] = result.translation;
          needSave = true;
        }
        
        if (needSave) {
          await Post.updateOne(
            { _id: post._id },
            { 
              $set: { 
                title: post.title,
                description: post.description,
                content: post.content,
                meta_title: post.meta_title,
                meta_description: post.meta_description
              } 
            }
          );
          translated++;
          console.log(`✅ Saved post ${post._id}\n`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (err) {
        failed++;
        const postTitle = getTextSafely(post.title, sourceLang) || 'Unknown';
        errors.push({
          postId: post._id,
          postTitle: postTitle,
          error: err.message
        });
        console.error(`❌ Failed to translate post ${post._id}:`, err.message);
      }
    }
    
    console.log(`✅ Translation completed: ${translated} success, ${failed} failed`);
    
    res.json({
      success: true,
      message: `Đã dịch ${translated}/${posts.length} bài viết`,
      translated,
      failed,
      total: posts.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in translateAllPosts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== POST CATEGORIES ✅ NEW ====================
exports.translateAllPostCategories = async (req, res) => {
  try {
    const { sourceLang = 'vi', targetLang = 'zh', force = false } = req.body;
    
    const query = force 
      ? {} 
      : { [`name.${targetLang}`]: { $in: ['', null] } };
    
    const categories = await PostCategory.find(query);
    
    if (categories.length === 0) {
      return res.json({
        success: true,
        message: 'Không có danh mục bài viết nào cần dịch',
        translated: 0,
        total: 0
      });
    }
    
    let translated = 0;
    let failed = 0;
    const errors = [];
    
    console.log(`📄 Starting translation for ${categories.length} post categories...`);
    
    for (const category of categories) {
      try {
        let needSave = false;
        
        category.name = ensureMultilingualObject(category.name, sourceLang);
        const sourceName = category.name[sourceLang];
        
        if (!sourceName) {
          console.warn(`⚠️  Post Category ${category._id} has no name in ${sourceLang}, skipping...`);
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
          console.log(`✅ Post Category: ${sourceName} → ${result.translation}`);
        }
        
        if (needSave) {
          await PostCategory.updateOne(
            { _id: category._id },
            { 
              $set: { 
                name: category.name
              } 
            }
          );
          translated++;
          console.log(`✅ Saved post category ${category._id}\n`);
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
        console.error(`❌ Failed to translate post category ${category._id}:`, err.message);
      }
    }
    
    console.log(`✅ Translation completed: ${translated} success, ${failed} failed`);
    
    res.json({
      success: true,
      message: `Đã dịch ${translated}/${categories.length} danh mục bài viết`,
      translated,
      failed,
      total: categories.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in translateAllPostCategories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== STATISTICS ✅ UPDATED ====================
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
    
    // ✅ Đếm posts
    const totalPosts = await Post.countDocuments({});
    const translatedPosts = await Post.countDocuments({
      [`title.${targetLang}`]: { $exists: true, $ne: '' }
    });
    
    // ✅ Đếm post categories
    const totalPostCategories = await PostCategory.countDocuments({});
    const translatedPostCategories = await PostCategory.countDocuments({
      [`name.${targetLang}`]: { $exists: true, $ne: '' }
    });
    
    // Đếm orders
    const allOrderDetails = await OrderDetail.find({});
    const multilingualOrders = allOrderDetails.filter(detail => 
      typeof detail.name === 'object'
    );
    
    const translatedOrders = multilingualOrders.filter(detail => {
      if (typeof detail.name !== 'object') return false;
      const hasVi = detail.name.vi && detail.name.vi.trim();
      const hasZh = detail.name.zh && detail.name.zh.trim();
      return hasVi && hasZh;
    });
    
    const pendingOrders = multilingualOrders.filter(detail => {
      if (typeof detail.name !== 'object') return false;
      const hasVi = detail.name.vi && detail.name.vi.trim();
      const hasZh = detail.name.zh && detail.name.zh.trim();
      return hasZh && !hasVi;
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
        posts: {
          total: totalPosts,
          translated: translatedPosts,
          pending: totalPosts - translatedPosts,
          percentage: totalPosts > 0 ? Math.round((translatedPosts / totalPosts) * 100) : 0
        },
        postCategories: {
          total: totalPostCategories,
          translated: translatedPostCategories,
          pending: totalPostCategories - translatedPostCategories,
          percentage: totalPostCategories > 0 ? Math.round((translatedPostCategories / totalPostCategories) * 100) : 0
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