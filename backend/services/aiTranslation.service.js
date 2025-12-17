// backend/services/aiTranslation.service.js - ALTERNATIVE VERSION
const translate = require('@iamtraction/google-translate');

class AITranslationService {
  
  /**
   * Translate text using Google Translate (FREE - No API Key needed)
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language (vi, zh)
   * @param {string} targetLang - Target language (vi, zh)
   * @param {string} context - Additional context (not used in Google Translate)
   * @returns {Promise<{translation: string, confidence: number, provider: string}>}
   */
  async translateWithClaude(text, sourceLang, targetLang, context = '') {
    try {
      console.log(`🔄 Translating: "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);
      
      const langMap = {
        vi: 'vi',
        zh: 'zh-CN'
      };

      // Dịch bằng Google Translate
      const result = await translate(text, {
        from: langMap[sourceLang],
        to: langMap[targetLang]
      });

      console.log(`✅ Translated: "${result.text.substring(0, 50)}..."`);

      return {
        translation: result.text,
        confidence: 0.75,
        provider: 'google-translate-free'
      };

    } catch (error) {
      console.error('❌ Google Translate error:', error.message);
      throw new Error(`Translation failed: ${error.message}. Please translate manually.`);
    }
  }

  /**
   * Batch translate multiple texts
   * @param {Array} texts - Array of {key, text, context}
   * @param {string} sourceLang
   * @param {string} targetLang
   */
  async batchTranslate(texts, sourceLang, targetLang) {
    console.log(`\n🚀 Starting batch translation: ${texts.length} items`);
    
    const results = [];
    const batchSize = 3;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}`);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await this.translateWithClaude(
            item.text,
            sourceLang,
            targetLang,
            item.context
          );
          
          successCount++;
          
          return {
            key: item.key,
            success: true,
            ...result
          };
        } catch (error) {
          failCount++;
          console.error(`❌ Failed to translate key "${item.key}": ${error.message}`);
          
          return {
            key: item.key,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay giữa các batch để tránh rate limit
      if (i + batchSize < texts.length) {
        const delayTime = 3000;
        console.log(`⏳ Waiting ${delayTime/1000}s before next batch...`);
        await this.delay(delayTime);
      }
    }

    console.log(`\n✅ Batch translation completed!`);
    console.log(`   Success: ${successCount}/${texts.length}`);
    console.log(`   Failed: ${failCount}/${texts.length}`);
    
    return results;
  }

  /**
   * Calculate translation confidence score
   */
  calculateConfidence(source, translation) {
    let score = 0.7;
    
    if (translation && translation.length > 0) score += 0.05;
    
    const lengthRatio = translation.length / source.length;
    if (lengthRatio > 0.3 && lengthRatio < 3) score += 0.1;
    
    if (!/(.)\1{5,}/.test(translation)) score += 0.1;
    
    if (translation !== source) score += 0.05;
    
    return Math.min(score, 1.0);
  }

  /**
   * Validate translation quality
   */
  async validateTranslation(originalText, translatedText, targetLang) {
    const score = this.calculateConfidence(originalText, translatedText) * 10;
    
    return {
      score: Math.round(score),
      feedback: 'Google Translate Free - Manual review recommended for accuracy',
      issues: translatedText === originalText 
        ? ['Translation appears identical to source'] 
        : []
    };
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AITranslationService();