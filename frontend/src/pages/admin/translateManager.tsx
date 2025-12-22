import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import "@/styles/pages/admin/translateManager.scss";

const API_URL = 'http://localhost:5000/api/admin';

const TranslationManagement = () => {
  const [translations, setTranslations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchTranslations();
    fetchStats();
  }, [filter]);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.search) params.append('search', filter.search);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/translations/keys?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        console.error('API Error:', data.message);
        toast.error(data.message || 'Failed to load translations');
        return;
      }
      
      setTranslations(data.data || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
      toast.error('Failed to load translations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/translations/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        console.warn('Failed to load stats');
        return;
      }
      
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAITranslate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      toast.info('🤖 Đang dịch...');
      
      const res = await fetch(`${API_URL}/translations/ai-translate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ translationId: id, targetLang: 'zh' })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Translation failed');
      }
      
      const confidence = data.data?.confidence || 0;
      toast.success(`✅ Dịch thành công! Độ tin cậy: ${(confidence * 100).toFixed(0)}%`);
      
      fetchTranslations();
      fetchStats();
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('❌ Dịch thất bại: ' + error.message);
    }
  };

  const handleBatchAITranslate = async () => {
    if (selectedKeys.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 key để dịch');
      return;
    }
    
    if (!confirm(`Dịch ${selectedKeys.length} keys bằng AI?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      toast.info(`🤖 Đang dịch ${selectedKeys.length} keys...`);
      
      const res = await fetch(`${API_URL}/translations/batch-ai-translate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ translationIds: selectedKeys, targetLang: 'zh' })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Batch translation failed');
      }
      
      toast.success(`✅ ${data.message}`);
      setSelectedKeys([]);
      fetchTranslations();
      fetchStats();
    } catch (error) {
      console.error('Batch translation error:', error);
      toast.error('❌ Batch dịch thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedKeys.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 key để approve');
      return;
    }
    
    const approvableKeys = selectedKeys.filter(id => {
      const trans = translations.find(t => t._id === id);
      return trans?.translations?.zh?.value && trans.translations.zh.status !== 'approved';
    });
    
    if (approvableKeys.length === 0) {
      toast.warning('Không có key nào có thể approve');
      return;
    }
    
    if (!confirm(`Approve ${approvableKeys.length} keys?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      toast.info(`✓ Đang approve ${approvableKeys.length} keys...`);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const id of approvableKeys) {
        try {
          const translation = translations.find(t => t._id === id);
          const res = await fetch(`${API_URL}/translations/${id}/review`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              lang: 'zh',
              value: translation.translations.zh.value,
              status: 'approved'
            })
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              successCount++;
            } else {
              failCount++;
            }
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`✅ Đã approve ${successCount} keys thành công!`);
      }
      if (failCount > 0) {
        toast.error(`❌ ${failCount} keys approve thất bại`);
      }
      
      setSelectedKeys([]);
      fetchTranslations();
      fetchStats();
    } catch (error) {
      console.error('Batch approve error:', error);
      toast.error('❌ Batch approve thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/translations/${id}/review`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lang: 'zh',
          value: editValue,
          status: 'human_reviewed'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Update failed');
      }
      
      toast.success('✅ Cập nhật thành công!');
      setEditingId(null);
      fetchTranslations();
      fetchStats();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('❌ Cập nhật thất bại: ' + error.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const translation = translations.find(t => t._id === id);
      
      if (!translation?.translations?.zh?.value) {
        toast.error('Không có bản dịch để approve');
        return;
      }
      
      const res = await fetch(`${API_URL}/translations/${id}/review`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lang: 'zh',
          value: translation.translations.zh.value,
          status: 'approved'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Approval failed');
      }
      
      toast.success('✅ Đã approve!');
      fetchTranslations();
      fetchStats();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('❌ Approve thất bại: ' + error.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedKeys(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status || 'draft'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  // Filtered translations
  const filteredTranslations = useMemo(() => {
    return translations;
  }, [translations]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTranslations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTranslations = filteredTranslations.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const approvableCount = selectedKeys.filter(id => {
    const trans = translations.find(t => t._id === id);
    return trans?.translations?.zh?.value && trans.translations.zh.status !== 'approved';
  }).length;

  return (
    <div className="translation-management">
      <h1>Dịch UI</h1>
      
      {/* Stats */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-label">Total Keys</div>
          <div className="stat-value">
            {stats.total?.[0]?.count || 0}
          </div>
        </div>
        <div className="stat-card ai-translated">
          <div className="stat-label">AI Translated</div>
          <div className="stat-value">
            {stats.byStatus?.find(s => s._id === 'ai_translated')?.count || 0}
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-label">Approved</div>
          <div className="stat-value">
            {stats.byStatus?.find(s => s._id === 'approved')?.count || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="🔍 Search keys..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="search-input"
        />
        
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="status-select"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="ai_translated">AI Translated</option>
          <option value="human_reviewed">Human Reviewed</option>
          <option value="approved">Approved</option>
        </select>
        
        <button
          onClick={handleBatchAITranslate}
          disabled={selectedKeys.length === 0 || loading}
          className="batch-translate-btn"
        >
          {loading ? '⏳ Đang dịch...' : `🤖 AI Translate (${selectedKeys.length})`}
        </button>

        <button
          onClick={handleBatchApprove}
          disabled={approvableCount === 0 || loading}
          className="batch-approve-btn"
          title={approvableCount === 0 ? 'Không có key nào có thể approve' : ''}
        >
          {loading ? '⏳ Đang approve...' : `✓ Approve (${approvableCount})`}
        </button>
      </div>

      {/* Translation Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-icon">⏳</div>
          <div>Đang tải...</div>
        </div>
      ) : filteredTranslations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔭</div>
          <div>Không có dữ liệu</div>
          <div className="empty-hint">
            Chạy: node backend/scripts/seedTranslations.js
          </div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="translation-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox"
                      checked={selectedKeys.length === currentTranslations.length && currentTranslations.length > 0}
                      onChange={(e) => setSelectedKeys(e.target.checked ? currentTranslations.map(t => t._id) : [])}
                    />
                  </th>
                  <th>Key</th>
                  <th>Vietnamese</th>
                  <th>Chinese</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTranslations.map((trans) => (
                  <tr key={trans._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedKeys.includes(trans._id)}
                        onChange={() => toggleSelect(trans._id)}
                      />
                    </td>
                    <td className="key-cell">
                      {trans.key}
                    </td>
                    <td className="text-cell">
                      {trans.translations?.vi?.value || '—'}
                    </td>
                    <td className="chinese-cell">
                      {editingId === trans._id ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="edit-textarea"
                        />
                      ) : (
                        <div>
                          {trans.translations?.zh?.value || '—'}
                        </div>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(trans.translations?.zh?.status || 'draft')}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {editingId === trans._id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(trans._id)}
                              className="save-btn"
                            >
                              💾 Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="cancel-btn"
                            >
                              ✖ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {(!trans.translations?.zh?.value || trans.translations.zh.status === 'draft') && (
                              <button
                                onClick={() => handleAITranslate(trans._id)}
                                className="ai-btn"
                              >
                                🤖 AI
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingId(trans._id);
                                setEditValue(trans.translations?.zh?.value || '');
                              }}
                              className="edit-btn"
                            >
                              ✏️ Edit
                            </button>
                            {trans.translations?.zh?.value && trans.translations.zh.status !== 'approved' && (
                              <button
                                onClick={() => handleApprove(trans._id)}
                                className="approve-btn"
                              >
                                ✓ Approve
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTranslations.length > 0 && (
            <div className="pagination">
              <div className="pagination-left">
                <div className="items-per-page">
                  <span>Hiển thị:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>keys/trang</span>
                </div>
                <div className="page-info">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredTranslations.length)} trong tổng số {filteredTranslations.length} keys
                </div>
              </div>

              {totalPages > 1 && (
                <div className="pagination-center">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Trước
                  </button>
                  
                  <div className="pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TranslationManagement;