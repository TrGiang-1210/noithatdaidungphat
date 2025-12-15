// backend/services/chatbotService.js
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

// Knowledge base cho bot
const KNOWLEDGE_BASE = {
  greetings: [
    'xin chào', 'chào', 'hello', 'hi', 'hey', 'chào bạn', 'chào shop'
  ],
  products: [
    'sản phẩm', 'hàng', 'có gì', 'bán gì', 'mua', 'giá', 'bao nhiêu', 'giá cả'
  ],
  categories: [
    'ghế', 'bàn', 'tủ', 'giường', 'kệ', 'sofa', 'văn phòng', 'phòng khách', 'phòng ngủ'
  ],
  delivery: [
    'giao hàng', 'ship', 'vận chuyển', 'ship cod', 'miễn phí', 'phí ship'
  ],
  contact: [
    'liên hệ', 'số điện thoại', 'sdt', 'địa chỉ', 'hotline', 'zalo', 'facebook'
  ],
  support: [
    'tư vấn', 'hỗ trợ', 'giúp đỡ', 'help', 'admin', 'nhân viên'
  ],
  thanks: [
    'cảm ơn', 'thanks', 'thank you', 'cám ơn', 'ok'
  ]
};

const BOT_RESPONSES = {
  greeting: [
    'Xin chào! 👋 Tôi là bot tự động của Nội Thất Đại Dũng Phát. Tôi có thể giúp gì cho bạn?',
    'Chào bạn! 😊 Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi. Bạn cần tư vấn gì?',
    'Hi! Rất vui được hỗ trợ bạn. Bạn đang tìm loại nội thất nào?'
  ],
  
  products: [
    'Chúng tôi chuyên cung cấp:\n• Ghế văn phòng\n• Bàn làm việc\n• Tủ hồ sơ\n• Ghế giám đốc\n• Kệ sách\n• Sofa văn phòng\n\nBạn quan tâm loại nào ạ?',
    'Shop có đầy đủ các loại nội thất văn phòng và gia đình:\n✓ Ghế xoay, ghế lưới\n✓ Bàn làm việc, bàn họp\n✓ Tủ tài liệu\n✓ Kệ trưng bày\n\nGiá cả cạnh tranh, chất lượng đảm bảo! 💪'
  ],
  
  categories: {
    'ghế': 'Về ghế, shop có nhiều loại:\n• Ghế văn phòng lưới\n• Ghế giám đốc cao cấp\n• Ghế chân quỳ\n• Ghế xoay 360°\n\nGiá từ 500k - 5tr. Bạn cần ghế loại nào?',
    'bàn': 'Về bàn làm việc, có các dòng:\n• Bàn văn phòng cơ bản\n• Bàn giám đốc\n• Bàn họp\n• Bàn máy tính\n\nGiá từ 800k - 10tr tùy kích thước.',
    'tủ': 'Về tủ, shop có:\n• Tủ hồ sơ 2-4 ngăn\n• Tủ tài liệu gỗ\n• Tủ sắt\n• Tủ đồ cá nhân\n\nGiá từ 1tr - 8tr.'
  },
  
  delivery: [
    'Về vận chuyển:\n📦 FREE SHIP nội thành HCM cho đơn từ 2 triệu\n🚚 Giao hàng toàn quốc\n⏰ Giao hàng trong 1-3 ngày\n💯 Hỗ trợ lắp đặt tận nơi',
    'Chúng tôi giao hàng:\n✓ HCM: 1-2 ngày\n✓ Các tỉnh: 3-5 ngày\n✓ Miễn phí ship đơn > 2tr\n✓ COD toàn quốc'
  ],
  
  contact: [
    '📞 Hotline: 0941 038 839 - 0965 708 839\n📧 Email: noithatdaidungphat@gmail.com\n📍 Địa chỉ: 474 ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An\n💬 Zalo: 0965708839',
    'Liên hệ chúng tôi:\n📞 0941 038 839\n📞 0965 708 839\n📧 noithatdaidungphat@gmail.com\n🏢 474 ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An'
  ],
  
  support: [
    'Để được tư vấn chi tiết, admin sẽ hỗ trợ bạn ngay! Vui lòng chờ trong giây lát... ⏰',
    'Tôi đang kết nối bạn với nhân viên tư vấn. Xin vui lòng đợi 1-2 phút nhé! 😊'
  ],
  
  thanks: [
    'Rất vui được hỗ trợ bạn! 😊 Nếu cần gì thêm cứ nhắn tin nhé!',
    'Không có gì! Chúc bạn một ngày tốt lành! 🌟',
    'Cảm ơn bạn đã quan tâm! Hẹn gặp lại! 👋'
  ],
  
  default: [
    'Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về:\n• Sản phẩm\n• Giá cả\n• Giao hàng\n• Liên hệ\n\nHoặc đợi admin tư vấn chi tiết nhé!',
    'Xin lỗi, tôi chưa có thông tin về vấn đề này. Admin sẽ hỗ trợ bạn sớm nhất! Hoặc gọi hotline: 0941 038 839 để được tư vấn ngay.',
    'Để được tư vấn chính xác, vui lòng liên hệ hotline: 0941 038 839 hoặc đợi admin trả lời nhé! 🙏'
  ]
};

// Hàm phân tích intent của message
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

// Hàm random response
function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

// Hàm tạo response dựa trên intent
function generateResponse(intent) {
  if (typeof intent === 'object' && intent.type === 'category') {
    return BOT_RESPONSES.categories[intent.category] || getRandomResponse(BOT_RESPONSES.default);
  }
  
  const responses = BOT_RESPONSES[intent];
  if (!responses) {
    return getRandomResponse(BOT_RESPONSES.default);
  }
  
  return getRandomResponse(responses);
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

// Hàm chính: Xử lý message và quyết định có reply không
async function handleUserMessage(message, roomId, activeAdmins) {
  try {
    const shouldRespond = await shouldBotRespond(roomId, activeAdmins);
    
    if (!shouldRespond) {
      console.log('🤖 Bot: Admin available, skipping bot response');
      return null;
    }
    
    console.log('🤖 Bot analyzing message:', message);
    
    const intent = analyzeIntent(message);
    console.log('🤖 Bot detected intent:', intent);
    
    const response = generateResponse(intent);
    console.log('🤖 Bot response:', response);
    
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    return {
      content: response,
      sender: 'bot',
      senderName: '🤖 Bot Tư Vấn'
    };
  } catch (error) {
    console.error('🤖 Bot error:', error);
    return null;
  }
}

module.exports = {
  handleUserMessage,
  analyzeIntent,
  generateResponse
};