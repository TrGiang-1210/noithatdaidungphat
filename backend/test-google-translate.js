// backend/test-google-translate.js
const aiTranslationService = require('./services/aiTranslation.service');

async function testTranslation() {
  console.log('🧪 Testing Google Translate API...\n');
  
  try {
    // Test 1: Single translation
    console.log('📝 Test 1: Single Translation');
    const result1 = await aiTranslationService.translateWithClaude(
      'Xin chào, chào mừng bạn đến với website của chúng tôi!',
      'vi',
      'zh'
    );
    console.log('✅ Result:', result1.translation);
    console.log('📊 Confidence:', result1.confidence);
    console.log('🔧 Provider:', result1.provider);
    
    console.log('\n---\n');
    
    // Test 2: Batch translation
    console.log('📝 Test 2: Batch Translation');
    const texts = [
      { key: 'common.welcome', text: 'Xin chào', context: 'Greeting' },
      { key: 'common.goodbye', text: 'Tạm biệt', context: 'Farewell' },
      { key: 'product.addToCart', text: 'Thêm vào giỏ hàng', context: 'Shopping cart button' }
    ];
    
    const batchResults = await aiTranslationService.batchTranslate(texts, 'vi', 'zh');
    
    console.log('\n📊 Batch Results:');
    batchResults.forEach((r, i) => {
      console.log(`\n${i+1}. Key: ${r.key}`);
      console.log(`   Success: ${r.success ? '✅' : '❌'}`);
      if (r.success) {
        console.log(`   Translation: ${r.translation}`);
        console.log(`   Confidence: ${r.confidence}`);
      } else {
        console.log(`   Error: ${r.error}`);
      }
    });
    
    console.log('\n\n✅ All tests completed!');
    console.log('💡 Tip: Google Translate is free but may have rate limits.');
    console.log('   Always review translations manually for accuracy.\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTranslation();