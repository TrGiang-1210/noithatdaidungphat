import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import "@/styles/pages/admin/databaseTranslation.scss";

interface TranslationStats {
  products: {
    total: number;
    translated: number;
    pending: number;
    percentage: number;
  };
  categories: {
    total: number;
    translated: number;
    pending: number;
    percentage: number;
  };
  orders: { // ✅ THÊM
    total: number;
    translated: number;
    pending: number;
    percentage: number;
  };
}

const DatabaseTranslation: React.FC = () => {
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState<'products' | 'categories' | 'orders' | null>(null);
  const [progress, setProgress] = useState<string>('');

  const getToken = () => localStorage.getItem('token');

  const loadStats = async () => {
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/bulk-translate/stats?targetLang=zh', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Không thể tải thống kê');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleTranslateProducts = async (force: boolean = false) => {
    const confirmMsg = force 
      ? 'Bạn có chắc muốn DỊCH LẠI TẤT CẢ sản phẩm? (Kể cả đã dịch)'
      : `Bạn có chắc muốn dịch ${stats?.products.pending || 0} sản phẩm chưa dịch?`;
    
    if (!confirm(confirmMsg)) return;

    setTranslating('products');
    setLoading(true);
    setProgress('Đang chuẩn bị...');

    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/bulk-translate/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceLang: 'vi',
          targetLang: 'zh',
          force
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Dịch thành công!');
        
        if (data.errors && data.errors.length > 0) {
          console.error('Translation errors:', data.errors);
          toast.error(`Có ${data.failed} sản phẩm lỗi, xem console để biết chi tiết`);
        }
        
        await loadStats();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error translating products:', error);
      toast.error('Không thể dịch sản phẩm');
    } finally {
      setLoading(false);
      setTranslating(null);
      setProgress('');
    }
  };

  const handleTranslateCategories = async (force: boolean = false) => {
    const confirmMsg = force 
      ? 'Bạn có chắc muốn DỊCH LẠI TẤT CẢ danh mục? (Kể cả đã dịch)'
      : `Bạn có chắc muốn dịch ${stats?.categories.pending || 0} danh mục chưa dịch?`;
    
    if (!confirm(confirmMsg)) return;

    setTranslating('categories');
    setLoading(true);
    setProgress('Đang chuẩn bị...');

    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/bulk-translate/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceLang: 'vi',
          targetLang: 'zh',
          force
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Dịch thành công!');
        
        if (data.errors && data.errors.length > 0) {
          console.error('Translation errors:', data.errors);
          toast.error(`Có ${data.failed} danh mục lỗi, xem console để biết chi tiết`);
        }
        
        await loadStats();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error translating categories:', error);
      toast.error('Không thể dịch danh mục');
    } finally {
      setLoading(false);
      setTranslating(null);
      setProgress('');
    }
  };

  // ✅ NEW: Dịch orders
  const handleTranslateOrders = async (force: boolean = false) => {
    const confirmMsg = force 
      ? 'Bạn có chắc muốn DỊCH LẠI TẤT CẢ đơn hàng? (Kể cả đã dịch)'
      : `Bạn có chắc muốn dịch ${stats?.orders.pending || 0} mục đơn hàng chưa dịch?`;
    
    if (!confirm(confirmMsg)) return;

    setTranslating('orders');
    setLoading(true);
    setProgress('Đang chuẩn bị...');

    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/bulk-translate/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceLang: 'vi',
          targetLang: 'zh',
          force
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Dịch thành công!');
        
        if (data.errors && data.errors.length > 0) {
          console.error('Translation errors:', data.errors);
          toast.error(`Có ${data.failed} mục đơn hàng lỗi, xem console để biết chi tiết`);
        }
        
        await loadStats();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error translating orders:', error);
      toast.error('Không thể dịch đơn hàng');
    } finally {
      setLoading(false);
      setTranslating(null);
      setProgress('');
    }
  };

  return (
    <div className="database-translation">
      <div className="page-header">
        <div className="header-content">
          <h1>Dịch Database</h1>
          <p>Chuyển đổi cấu trúc dữ liệu trong DB từ string → Object đa ngôn ngữ</p>
        </div>
        <button 
          className="btn-refresh" 
          onClick={loadStats}
          disabled={loading}
        >
          🔄 Làm mới
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          {/* Products */}
          <div className="stat-card products">
            <div className="stat-header">
              <div className="stat-icon">📦</div>
              <h3>Sản phẩm (Products)</h3>
            </div>
            
            <div className="stat-numbers">
              <div className="stat-row">
                <span className="label">Tổng cộng:</span>
                <span className="value">{stats.products.total}</span>
              </div>
              <div className="stat-row">
                <span className="label">Đã dịch:</span>
                <span className="value success">{stats.products.translated}</span>
              </div>
              <div className="stat-row">
                <span className="label">Chưa dịch:</span>
                <span className="value pending">{stats.products.pending}</span>
              </div>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill products"
                style={{ width: `${stats.products.percentage}%` }}
              >
                <span className="progress-text">{stats.products.percentage}%</span>
              </div>
            </div>

            <div className="stat-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleTranslateProducts(false)}
                disabled={loading || stats.products.pending === 0}
              >
                {translating === 'products' ? (
                  <>
                    <span className="spinner"></span>
                    Đang dịch...
                  </>
                ) : (
                  <>✨ Dịch {stats.products.pending} sản phẩm chưa dịch</>
                )}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => handleTranslateProducts(true)}
                disabled={loading}
                title="Dịch lại tất cả, kể cả đã dịch"
              >
                🔄 Dịch lại tất cả
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="stat-card categories">
            <div className="stat-header">
              <div className="stat-icon">📁</div>
              <h3>Danh mục (Categories)</h3>
            </div>
            
            <div className="stat-numbers">
              <div className="stat-row">
                <span className="label">Tổng cộng:</span>
                <span className="value">{stats.categories.total}</span>
              </div>
              <div className="stat-row">
                <span className="label">Đã dịch:</span>
                <span className="value success">{stats.categories.translated}</span>
              </div>
              <div className="stat-row">
                <span className="label">Chưa dịch:</span>
                <span className="value pending">{stats.categories.pending}</span>
              </div>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill categories"
                style={{ width: `${stats.categories.percentage}%` }}
              >
                <span className="progress-text">{stats.categories.percentage}%</span>
              </div>
            </div>

            <div className="stat-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleTranslateCategories(false)}
                disabled={loading || stats.categories.pending === 0}
              >
                {translating === 'categories' ? (
                  <>
                    <span className="spinner"></span>
                    Đang dịch...
                  </>
                ) : (
                  <>✨ Dịch {stats.categories.pending} danh mục chưa dịch</>
                )}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => handleTranslateCategories(true)}
                disabled={loading}
                title="Dịch lại tất cả, kể cả đã dịch"
              >
                🔄 Dịch lại tất cả
              </button>
            </div>
          </div>

          {/* ✅ NEW: Orders */}
          <div className="stat-card orders">
            <div className="stat-header">
              <div className="stat-icon">🛒</div>
              <h3>Đơn hàng (Orders)</h3>
            </div>
            
            <div className="stat-numbers">
              <div className="stat-row">
                <span className="label">Tổng cộng:</span>
                <span className="value">{stats.orders.total}</span>
              </div>
              <div className="stat-row">
                <span className="label">Đã dịch:</span>
                <span className="value success">{stats.orders.translated}</span>
              </div>
              <div className="stat-row">
                <span className="label">Chưa dịch:</span>
                <span className="value pending">{stats.orders.pending}</span>
              </div>
            </div>

            <div className="progress-bar">
              <div 
                className="progress-fill orders"
                style={{ width: `${stats.orders.percentage}%` }}
              >
                <span className="progress-text">{stats.orders.percentage}%</span>
              </div>
            </div>

            <div className="stat-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleTranslateOrders(false)}
                disabled={loading || stats.orders.pending === 0}
              >
                {translating === 'orders' ? (
                  <>
                    <span className="spinner"></span>
                    Đang dịch...
                  </>
                ) : (
                  <>✨ Dịch {stats.orders.pending} đơn hàng chưa dịch</>
                )}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => handleTranslateOrders(true)}
                disabled={loading}
                title="Dịch lại tất cả, kể cả đã dịch"
              >
                🔄 Dịch lại tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="progress-indicator">
          <div className="spinner-large"></div>
          <p>{progress || 'Đang xử lý...'}</p>
          <small>Vui lòng đợi, không đóng trang này</small>
        </div>
      )}

      <div className="instructions-section">
        <h3>📚 Hướng dẫn sử dụng:</h3>
        
        <div className="instruction-grid">
          <div className="instruction-card">
            <div className="step-number">1</div>
            <h4>Kiểm tra thống kê</h4>
            <p>Xem số lượng items chưa dịch ở phía trên (Products, Categories, Orders)</p>
          </div>

          <div className="instruction-card">
            <div className="step-number">2</div>
            <h4>Chọn loại dịch</h4>
            <p>Nhấn "Dịch X items chưa dịch" để dịch items mới, hoặc "Dịch lại tất cả" để force</p>
          </div>

          <div className="instruction-card">
            <div className="step-number">3</div>
            <h4>Đợi hoàn thành</h4>
            <p>Quá trình có delay 1.5s giữa mỗi item để tránh rate limit. Không đóng trang!</p>
          </div>

          <div className="instruction-card">
            <div className="step-number">4</div>
            <h4>Kiểm tra kết quả</h4>
            <p>Sau khi xong, vào trang Products/Categories/Orders để xem bản dịch</p>
          </div>
        </div>

        <div className="tips-box">
          <h4>💡 Chú ý:</h4>
          <ul>
            <li><strong>Google Translate Free:</strong> Chất lượng dịch ổn nhưng không hoàn hảo, nên review lại</li>
            <li><strong>Delay 1.5s:</strong> Mỗi item có delay để tránh bị block bởi Google</li>
            <li><strong>Orders:</strong> Bao gồm tên sản phẩm và thuộc tính đã chọn (màu sắc, kích thước...)</li>
            <li><strong>Errors:</strong> Nếu có lỗi, xem console (F12) để biết chi tiết</li>
            <li><strong>Force mode:</strong> Chỉ dùng khi muốn dịch lại tất cả (cẩn thận!)</li>
          </ul>
        </div>

        <div className="warning-box">
          <h4>⚠️ Cảnh báo:</h4>
          <ul>
            <li>Quá trình dịch có thể mất từ vài phút đến hàng chục phút tùy số lượng</li>
            <li>KHÔNG đóng tab browser khi đang dịch</li>
            <li>KHÔNG spam nút "Dịch" nhiều lần</li>
            <li>"Force mode" sẽ GHI ĐÈ tất cả bản dịch hiện tại</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTranslation;