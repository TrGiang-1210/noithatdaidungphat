import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api/admin';

const TranslationManagement = () => {
  const [translations, setTranslations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

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
    const colors = {
      draft: '#9e9e9e',
      ai_translated: '#2196f3',
      human_reviewed: '#ff9800',
      approved: '#4caf50'
    };
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: colors[status] || '#9e9e9e'
      }}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Quản lý dịch thuật</h1>
      
      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Keys</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {stats.total?.[0]?.count || 0}
          </div>
        </div>
        <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '12px', color: '#666' }}>AI Translated</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
            {stats.byStatus?.find(s => s._id === 'ai_translated')?.count || 0}
          </div>
        </div>
        <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px', flex: 1 }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Approved</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
            {stats.byStatus?.find(s => s._id === 'approved')?.count || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Search keys..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
        />
        
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
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
          style={{
            padding: '10px 20px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedKeys.length > 0 && !loading ? 'pointer' : 'not-allowed',
            opacity: selectedKeys.length === 0 || loading ? 0.5 : 1
          }}
        >
          {loading ? '⏳ Đang dịch...' : `🤖 AI Translate (${selectedKeys.length})`}
        </button>
      </div>

      {/* Translation Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>⏳</div>
          <div>Đang tải...</div>
        </div>
      ) : translations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
          <div>Không có dữ liệu</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            Chạy: node backend/scripts/seedTranslations.js
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>
                  <input 
                    type="checkbox"
                    checked={selectedKeys.length === translations.length && translations.length > 0}
                    onChange={(e) => setSelectedKeys(e.target.checked ? translations.map(t => t._id) : [])}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Key</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Vietnamese</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Chinese</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {translations.map((trans) => (
                <tr key={trans._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedKeys.includes(trans._id)}
                      onChange={() => toggleSelect(trans._id)}
                    />
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                    {trans.key}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '200px' }}>
                    {trans.translations?.vi?.value || '—'}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '250px' }}>
                    {editingId === trans._id ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          minHeight: '60px', 
                          fontFamily: '"Noto Sans SC", sans-serif',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <div style={{ fontFamily: '"Noto Sans SC", sans-serif' }}>
                        {trans.translations?.zh?.value || '—'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getStatusBadge(trans.translations?.zh?.status || 'draft')}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {editingId === trans._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(trans._id)}
                            style={{ 
                              padding: '5px 10px', 
                              background: '#4caf50', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              cursor: 'pointer', 
                              fontSize: '12px' 
                            }}
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ 
                              padding: '5px 10px', 
                              background: '#f44336', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              cursor: 'pointer', 
                              fontSize: '12px' 
                            }}
                          >
                            ✖ Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {(!trans.translations?.zh?.value || trans.translations.zh.status === 'draft') && (
                            <button
                              onClick={() => handleAITranslate(trans._id)}
                              style={{ 
                                padding: '5px 10px', 
                                background: '#2196f3', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer', 
                                fontSize: '12px' 
                              }}
                            >
                              🤖 AI
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingId(trans._id);
                              setEditValue(trans.translations?.zh?.value || '');
                            }}
                            style={{ 
                              padding: '5px 10px', 
                              background: '#ff9800', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px', 
                              cursor: 'pointer', 
                              fontSize: '12px' 
                            }}
                          >
                            ✏️ Edit
                          </button>
                          {trans.translations?.zh?.status === 'ai_translated' && (
                            <button
                              onClick={() => handleApprove(trans._id)}
                              style={{ 
                                padding: '5px 10px', 
                                background: '#4caf50', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer', 
                                fontSize: '12px' 
                              }}
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
      )}
    </div>
  );
};

export default TranslationManagement;