import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
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
  respondedAt?: string;
  createdAt: string;
  campsite: {
    id: string;
    name: string;
    location: string;
    images: string[];
  };
  responder?: {
    firstName: string;
    lastName: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MyInquiries: React.FC = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered' | 'closed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, [filter]);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const params = filter !== 'all' ? { status: filter } : {};
      const response = await axios.get(`${API_URL}/inquiries/my-inquiries`, {
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        icon: <Clock className="w-4 h-4" />,
        text: '답변 대기',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      answered: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: '답변 완료',
        className: 'bg-green-100 text-green-700 border-green-200',
      },
      closed: {
        icon: <XCircle className="w-4 h-4" />,
        text: '종료',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      },
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${badge.className}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: '일반 문의',
      booking: '예약 관련',
      facilities: '시설 문의',
      pricing: '요금 문의',
      cancellation: '취소/환불',
      other: '기타',
    };
    return labels[category] || category;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-600" />
            나의 문의 내역
          </h1>
          <p className="text-gray-600 mt-2">캠프장에 문의한 내역을 확인하고 관리하세요</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '전체' },
              { value: 'pending', label: '답변 대기' },
              { value: 'answered', label: '답변 완료' },
              { value: 'closed', label: '종료' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === item.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries List */}
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">문의 내역이 없습니다</h3>
              <p className="text-gray-500">캠프장에 궁금한 점을 문의해보세요!</p>
            </div>
          ) : (
            inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 cursor-pointer"
                onClick={() => setSelectedInquiry(inquiry)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status and Priority */}
                    <div className="flex items-center gap-2 mb-3">
                      {getStatusBadge(inquiry.status)}
                      <span className={`inline-flex items-center gap-1 text-sm ${getPriorityColor(inquiry.priority)}`}>
                        <AlertCircle className="w-4 h-4" />
                        {inquiry.priority === 'high' && '긴급'}
                        {inquiry.priority === 'normal' && '보통'}
                        {inquiry.priority === 'low' && '낮음'}
                      </span>
                    </div>

                    {/* Subject */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                      {inquiry.subject}
                    </h3>

                    {/* Campsite Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{inquiry.campsite.name}</span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {getCategoryLabel(inquiry.category)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>

                    {/* Message Preview */}
                    <p className="text-gray-600 line-clamp-2">{inquiry.message}</p>

                    {/* Response Preview */}
                    {inquiry.response && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          답변: {inquiry.responder?.firstName} {inquiry.responder?.lastName}
                        </p>
                        <p className="text-sm text-green-800 line-clamp-2">{inquiry.response}</p>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={inquiry.campsite.images[0] || '/placeholder.jpg'}
                      alt={inquiry.campsite.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* View Details Button */}
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <button className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                    자세히 보기
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedInquiry.subject}
                  </h2>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedInquiry.status)}
                    <span className="text-sm text-gray-500">
                      {formatDate(selectedInquiry.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Campsite Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={selectedInquiry.campsite.images[0] || '/placeholder.jpg'}
                  alt={selectedInquiry.campsite.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedInquiry.campsite.name}</h3>
                  <p className="text-sm text-gray-600">{selectedInquiry.campsite.location}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Original Message */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">문의 내용</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
              </div>

              {/* Response */}
              {selectedInquiry.response ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">답변</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                      <span className="font-semibold">
                        {selectedInquiry.responder?.firstName} {selectedInquiry.responder?.lastName}
                      </span>
                      <span>•</span>
                      <span>{formatDate(selectedInquiry.respondedAt!)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedInquiry.response}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-yellow-800 font-medium">답변을 기다리고 있습니다</p>
                  <p className="text-sm text-yellow-700 mt-1">영업일 기준 24시간 이내에 답변드립니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInquiries;
