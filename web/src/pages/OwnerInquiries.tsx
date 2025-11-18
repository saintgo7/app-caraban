import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MessageCircle,
  Clock,
  CheckCircle,
  Send,
  Search,
  Filter,
  AlertTriangle,
  X,
  User,
  Calendar,
  Tag,
} from 'lucide-react';

interface Inquiry {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: 'pending' | 'answered' | 'closed';
  response?: string;
  createdAt: string;
  respondedAt?: string;
  isRead: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  responder?: {
    firstName: string;
    lastName: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OwnerInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, [filters]);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // TODO: Replace with actual campsite ID
      const campsiteId = 'your-campsite-id';

      const params: any = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.priority !== 'all') params.priority = filters.priority;
      if (filters.category !== 'all') params.category = filters.category;

      const response = await axios.get(`${API_URL}/inquiries/campsite/${campsiteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setInquiries(response.data.inquiries);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !response.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await axios.post(
        `${API_URL}/inquiries/${selectedInquiry.id}/respond`,
        {
          response,
          status: 'answered',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh inquiries
      await fetchInquiries();
      setSelectedInquiry(null);
      setResponse('');
    } catch (error) {
      console.error('Failed to respond:', error);
      alert('답변 전송에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) =>
    inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'pending').length,
    answered: inquiries.filter((i) => i.status === 'answered').length,
    unread: inquiries.filter((i) => !i.isRead).length,
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-500 bg-gray-100',
      normal: 'text-blue-600 bg-blue-100',
      high: 'text-red-600 bg-red-100',
    };
    return colors[priority] || 'text-gray-500 bg-gray-100';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: '일반',
      booking: '예약',
      facilities: '시설',
      pricing: '요금',
      cancellation: '취소',
      other: '기타',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    if (hours < 48) return '어제';

    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-600" />
            문의 관리
          </h1>
          <p className="text-gray-600 mt-2">고객 문의를 확인하고 답변하세요</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">전체 문의</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">답변 대기</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">답변 완료</div>
            <div className="text-3xl font-bold text-green-600">{stats.answered}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">읽지 않음</div>
            <div className="text-3xl font-bold text-red-600">{stats.unread}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="제목, 내용, 이메일로 검색..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">모든 상태</option>
                <option value="pending">답변 대기</option>
                <option value="answered">답변 완료</option>
                <option value="closed">종료</option>
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">모든 중요도</option>
                <option value="high">긴급</option>
                <option value="normal">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredInquiries.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                문의가 없습니다
              </h3>
              <p className="text-gray-500">새로운 문의가 들어오면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className={`p-6 hover:bg-gray-50 transition cursor-pointer ${
                    !inquiry.isRead ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        {!inquiry.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(inquiry.priority)}`}>
                          {inquiry.priority === 'high' && '🔴 긴급'}
                          {inquiry.priority === 'normal' && '🟡 보통'}
                          {inquiry.priority === 'low' && '🟢 낮음'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {getCategoryLabel(inquiry.category)}
                        </span>
                        {inquiry.status === 'pending' ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            답변 대기
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            답변 완료
                          </span>
                        )}
                      </div>

                      {/* Subject */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {inquiry.subject}
                      </h3>

                      {/* Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {inquiry.user.firstName} {inquiry.user.lastName}
                        </span>
                        <span>{inquiry.user.email}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(inquiry.createdAt)}
                        </span>
                      </div>

                      {/* Message Preview */}
                      <p className="text-gray-700 line-clamp-2">{inquiry.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail & Response Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedInquiry.subject}</h2>
                  <div className="flex items-center gap-2 text-green-100">
                    <User className="w-4 h-4" />
                    <span>
                      {selectedInquiry.user.firstName} {selectedInquiry.user.lastName} ({selectedInquiry.user.email})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
                  {getCategoryLabel(selectedInquiry.category)}
                </span>
                <span className="text-sm">{formatDate(selectedInquiry.createdAt)}</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Message */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  문의 내용
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedInquiry.message}
                  </p>
                </div>
              </div>

              {/* Response Section */}
              {selectedInquiry.response ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    답변 내용
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                      <span className="font-semibold">
                        {selectedInquiry.responder?.firstName} {selectedInquiry.responder?.lastName}
                      </span>
                      <span>•</span>
                      <span>{formatDate(selectedInquiry.respondedAt!)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedInquiry.response}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRespond}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Send className="w-5 h-5 text-green-600" />
                    답변 작성
                  </h3>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={6}
                    placeholder="고객에게 보낼 답변을 작성하세요..."
                    required
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedInquiry(null)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !response.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>전송 중...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>답변 전송</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerInquiries;
