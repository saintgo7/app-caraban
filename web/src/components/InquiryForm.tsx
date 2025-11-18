import React, { useState } from 'react';
import { Send, X, MessageCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface InquiryFormProps {
  campsiteId: string;
  campsiteName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const InquiryForm: React.FC<InquiryFormProps> = ({
  campsiteId,
  campsiteName,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'normal',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'general', label: '일반 문의' },
    { value: 'booking', label: '예약 관련' },
    { value: 'facilities', label: '시설 문의' },
    { value: 'pricing', label: '요금 문의' },
    { value: 'cancellation', label: '취소/환불' },
    { value: 'other', label: '기타' },
  ];

  const priorities = [
    { value: 'low', label: '낮음' },
    { value: 'normal', label: '보통' },
    { value: 'high', label: '긴급' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      await axios.post(
        `${API_URL}/inquiries`,
        {
          campsiteId,
          ...formData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to submit inquiry:', err);
      setError(err.response?.data?.message || '문의 전송에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">문의하기</h2>
                <p className="text-green-100 mt-1">{campsiteName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                중요도
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                {priorities.map((pri) => (
                  <option key={pri.value} value={pri.value}>
                    {pri.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="문의 제목을 입력하세요"
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.subject.length}/200</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              문의 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
              rows={8}
              placeholder="자세한 문의 내용을 입력해주세요 (최소 10자)"
              minLength={10}
              maxLength={5000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.message.length}/5000</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📌 안내사항</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 영업일 기준 24시간 이내에 답변드립니다.</li>
              <li>• 긴급한 문의는 전화로 연락 주시기 바랍니다.</li>
              <li>• 문의 내역은 마이페이지에서 확인하실 수 있습니다.</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>전송 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>문의 전송</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryForm;
