import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/admin'; // ✅ Thêm /admin

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
      const data = await res.json();
      
      if (!data.success) {
        console.error('API Error:', data.message);
        return;
      }
      
      setTranslations(data.data || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/translations/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      const res = await fetch(`${API_URL}/translations/ai-translate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ translationId: id, targetLang: 'zh' })
      });
      const data = await res.json();
      alert(`✅ Translated! Confidence: ${(data.data.confidence * 100).toFixed(0)}%`);
      fetchTranslations();
    } catch (error) {
      alert('❌ Translation failed: ' + error.message);
    }
  };

  const handleBatchAITranslate = async () => {
    if (selectedKeys.length === 0) {
      alert('Please select keys to translate');
      return;
    }
    
    if (!confirm(`Translate ${selectedKeys.length} keys with AI?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/translations/batch-translate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ translationIds: selectedKeys, targetLang: 'zh' })
      });
      const data = await res.json();
      alert(`✅ ${data.message}`);
      setSelectedKeys([]);
      fetchTranslations();
    } catch (error) {
      alert('❌ Batch translation failed');
    }
    setLoading(false);
  };

  const handleSaveEdit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/translations/${id}/review`, {
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
      alert('✅ Translation updated!');
      setEditingId(null);
      fetchTranslations();
    } catch (error) {
      alert('❌ Update failed');
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const translation = translations.find(t => t._id === id);
      await fetch(`${API_URL}/translations/${id}/review`, {
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
      alert('✅ Approved!');
      fetchTranslations();
    } catch (error) {
      alert('❌ Approval failed');
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
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🌐 Translation Management</h1>
      
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
            cursor: selectedKeys.length > 0 ? 'pointer' : 'not-allowed',
            opacity: selectedKeys.length === 0 ? 0.5 : 1
          }}
        >
          🤖 AI Translate ({selectedKeys.length})
        </button>
      </div>

      {/* Translation Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
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
                  <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                    {trans.key}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '200px' }}>
                    {trans.translations.vi.value}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '250px' }}>
                    {editingId === trans._id ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{ width: '100%', padding: '8px', minHeight: '60px', fontFamily: '"Noto Sans SC", sans-serif' }}
                      />
                    ) : (
                      <div style={{ fontFamily: '"Noto Sans SC", sans-serif' }}>
                        {trans.translations.zh?.value || '—'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getStatusBadge(trans.translations.zh?.status)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {editingId === trans._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(trans._id)}
                            style={{ padding: '5px 10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✖ Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {!trans.translations.zh?.value && (
                            <button
                              onClick={() => handleAITranslate(trans._id)}
                              style={{ padding: '5px 10px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              🤖 AI
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingId(trans._id);
                              setEditValue(trans.translations.zh?.value || '');
                            }}
                            style={{ padding: '5px 10px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✏️ Edit
                          </button>
                          {trans.translations.zh?.status === 'ai_translated' && (
                            <button
                              onClick={() => handleApprove(trans._id)}
                              style={{ padding: '5px 10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
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