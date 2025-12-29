// backend/services/chatbotService.js
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

// Knowledge base cho bot (không đổi)
const KNOWLEDGE_BASE = {
  greetings: [
    'xin chào', 'chào', 'hello', 'hi', 'hey', 'chào bạn', 'chào shop',
    '你好', '您好', 'nihao', 'hello'
  ],
  products: [
    'sản phẩm', 'hàng', 'có gì', 'bán gì', 'mua', 'giá', 'bao nhiêu', 'giá cả',
    '产品', '商品', '价格', '多少钱', '买'
  ],
  categories: [
    'ghế', 'bàn', 'tủ', 'giường', 'kệ', 'sofa', 'văn phòng', 'phòng khách', 'phòng ngủ',
    '椅子', '桌子', '柜子', '床', '沙发', '办公室'
  ],
  delivery: [
    'giao hàng', 'ship', 'vận chuyển', 'ship cod', 'miễn phí', 'phí ship',
    '运输', '送货', '快递', '免费'
  ],
  contact: [
    'liên hệ', 'số điện thoại', 'sdt', 'địa chỉ', 'hotline', 'zalo', 'facebook',
    '联系', '电话', '地址'
  ],
  support: [
    'tư vấn', 'hỗ trợ', 'giúp đỡ', 'help', 'admin', 'nhân viên',
    '咨询', '帮助', '支持'
  ],
  thanks: [
    'cảm ơn', 'thanks', 'thank you', 'cám ơn', 'ok',
    '谢谢', '感谢', 'xiexie'
  ]
};

// ✅ BOT RESPONSES - GIÁO TRẢ VỀ TRANSLATION KEYS
const BOT_RESPONSE_KEYS = {
  greeting: ['bot.greeting1', 'bot.greeting2', 'bot.greeting3'],
  products: ['bot.products1', 'bot.products2'],
  
  categories: {
    'ghế': 'bot.categoryChair',
    '椅子': 'bot.categoryChair',
    'chair': 'bot.categoryChair',
    
    'bàn': 'bot.categoryDesk',
    '桌子': 'bot.categoryDesk',
    'desk': 'bot.categoryDesk',
    
    'tủ': 'bot.categoryCabinet',
    '柜子': 'bot.categoryCabinet',
    'cabinet': 'bot.categoryCabinet',
  },
  
  delivery: ['bot.delivery1', 'bot.delivery2'],
  contact: ['bot.contact1', 'bot.contact2'],
  support: ['bot.support1', 'bot.support2'],
  thanks: ['bot.thanks1', 'bot.thanks2', 'bot.thanks3'],
  default: ['bot.default1', 'bot.default2', 'bot.default3']
};

// Hàm phân tích intent của message (không đổi)
function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase().trim();
  
  if (KNOWLEDGE_BASE.greetings.some(word => lowerMessage.includes(word))) {
    return 'greeting';
  }
  
  if (KNOWLEDGE_BASE.products.some(word => lowerMessage.includes(word))) {
    return 'products';
  }
  
  for (const category of KNOWLEDGE_BASE.categories) {
    if (lowerMessage.includes(category)) {
      return { type: 'category', category };
    }
  }
  
  if (KNOWLEDGE_BASE.delivery.some(word => lowerMessage.includes(word))) {
    return 'delivery';
  }
  
  if (KNOWLEDGE_BASE.contact.some(word => lowerMessage.includes(word))) {
    return 'contact';
  }
  
  if (KNOWLEDGE_BASE.support.some(word => lowerMessage.includes(word))) {
    return 'support';
  }
  
  if (KNOWLEDGE_BASE.thanks.some(word => lowerMessage.includes(word))) {
    return 'thanks';
  }
  
  return 'default';
}

// Hàm random response key
function getRandomResponseKey(keys) {
  return keys[Math.floor(Math.random() * keys.length)];
}

// ✅ HÀM TẠO RESPONSE KEY DỰA TRÊN INTENT
function generateResponseKey(intent) {
  if (typeof intent === 'object' && intent.type === 'category') {
    return BOT_RESPONSE_KEYS.categories[intent.category] || getRandomResponseKey(BOT_RESPONSE_KEYS.default);
  }
  
  const keys = BOT_RESPONSE_KEYS[intent];
  if (!keys) {
    return getRandomResponseKey(BOT_RESPONSE_KEYS.default);
  }
  
  return getRandomResponseKey(keys);
}

// ✅ HÀM LẤY TRANSLATED TEXT TỪ DATABASE
async function getTranslatedResponse(responseKey, lang = 'vi') {
  try {
    const Translation = require('../models/Translation');
    
    const translation = await Translation.findOne({ key: responseKey });
    
    if (!translation) {
      console.warn(`⚠️ Translation not found for key: ${responseKey}`);
      return null;
    }
    
    // Lấy text theo ngôn ngữ
    const translatedText = translation.translations?.[lang]?.value;
    
    if (!translatedText) {
      console.warn(`⚠️ No ${lang} translation for key: ${responseKey}`);
      // Fallback về tiếng Việt
      return translation.translations?.vi?.value || null;
    }
    
    return translatedText;
  } catch (error) {
    console.error('❌ Error getting translated response:', error);
    return null;
  }
}

// Hàm check xem có admin online không
async function isAdminOnline(activeAdmins) {
  return activeAdmins && activeAdmins.size > 0;
}

// Hàm check xem user đã nhắn bao nhiêu lần chưa có admin reply
async function shouldBotRespond(roomId, activeAdmins) {
  if (!await isAdminOnline(activeAdmins)) {
    return true;
  }
  
  const recentMessages = await Message.find({ roomId })
    .sort({ timestamp: -1 })
    .limit(5);
  
  let consecutiveUserMessages = 0;
  for (const msg of recentMessages) {
    if (msg.sender === 'user') {
      consecutiveUserMessages++;
    } else {
      break;
    }
  }
  
  return consecutiveUserMessages >= 2;
}

// ✅ HÀM CHÍNH: XỬ LÝ MESSAGE VÀ TRẢ VỀ TRANSLATED RESPONSE
async function handleUserMessage(message, roomId, activeAdmins, lang = 'vi') {
  try {
    const shouldRespond = await shouldBotRespond(roomId, activeAdmins);
    
    if (!shouldRespond) {
      console.log('🤖 Bot: Admin available, skipping bot response');
      return null;
    }
    
    console.log('🤖 Bot analyzing message:', message, '| Language:', lang);
    
    const intent = analyzeIntent(message);
    console.log('🤖 Bot detected intent:', intent);
    
    const responseKey = generateResponseKey(intent);
    console.log('🤖 Bot response key:', responseKey);
    
    // Lấy translated text
    const translatedResponse = await getTranslatedResponse(responseKey, lang);
    
    if (!translatedResponse) {
      console.error('❌ Could not get translated response for key:', responseKey);
      return null;
    }
    
    console.log('🤖 Bot translated response:', translatedResponse.substring(0, 50) + '...');
    
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Lấy bot name đã dịch
    const Translation = require('../models/Translation');
    const botNameTranslation = await Translation.findOne({ key: 'bot.botName' });
    const botName = botNameTranslation?.translations?.[lang]?.value || '🤖 Bot Tư Vấn';
    
    return {
      content: translatedResponse,
      sender: 'bot',
      senderName: botName
    };
  } catch (error) {
    console.error('🤖 Bot error:', error);
    return null;
  }
}

module.exports = {
  handleUserMessage,
  analyzeIntent,
  generateResponseKey,
  getTranslatedResponse
};