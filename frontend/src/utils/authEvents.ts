// frontend/src/utils/authEvents.ts

/**
 * Trigger khi user login thành công
 * Gọi hàm này trong login handler của bạn
 */
export function triggerUserLogin() {
  // Dispatch custom event để các component khác biết
  window.dispatchEvent(new Event('user-login'));
  console.log('🔔 User login event triggered');
}

/**
 * Trigger khi user logout
 * Gọi hàm này trong logout handler của bạn
 */
export function triggerUserLogout() {
  // Clear guest ID nếu có
  localStorage.removeItem('chat_guest_id');
  
  // Dispatch custom event
  window.dispatchEvent(new Event('user-logout'));
  console.log('🔔 User logout event triggered');
}

/**
 * Get current user info từ localStorage
 */
export function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return {
        userId: user._id || user.id,
        userName: user.name,
        userEmail: user.email,
        isLoggedIn: true
      };
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  
  return {
    userId: undefined,
    userName: undefined,
    userEmail: undefined,
    isLoggedIn: false
  };
}