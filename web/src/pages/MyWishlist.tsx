import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Heart,
  MapPin,
  Star,
  Trash2,
  Calendar,
  Users,
  Bell,
  BellOff,
  Edit3,
  X,
} from 'lucide-react';

interface WishlistItem {
  id: string;
  notes?: string;
  notifyOnAvailability: boolean;
  createdAt: string;
  campsite: {
    id: string;
    name: string;
    location: string;
    description: string;
    images: string[];
    pricePerNight: number;
    rating: number;
    amenities: string[];
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MyWishlist: React.FC = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editNotify, setEditNotify] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWishlist(response.data.wishlist);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (campsiteId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await axios.delete(`${API_URL}/wishlist/${campsiteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWishlist((prev) => prev.filter((item) => item.campsite.id !== campsiteId));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const updateWishlistItem = async () => {
    if (!editingItem) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await axios.patch(
        `${API_URL}/wishlist/${editingItem.id}`,
        {
          notes: editNotes,
          notifyOnAvailability: editNotify,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWishlist((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, notes: editNotes, notifyOnAvailability: editNotify }
            : item
        )
      );

      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update wishlist item:', error);
    }
  };

  const openEditModal = (item: WishlistItem) => {
    setEditingItem(item);
    setEditNotes(item.notes || '');
    setEditNotify(item.notifyOnAvailability);
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
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            나의 위시리스트
          </h1>
          <p className="text-gray-600 mt-2">
            저장한 캠프장 {wishlist.length}개
          </p>
        </div>

        {/* Wishlist Grid */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              저장된 캠프장이 없습니다
            </h3>
            <p className="text-gray-500 mb-6">마음에 드는 캠프장을 저장해보세요!</p>
            <button
              onClick={() => navigate('/campsites')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              캠프장 둘러보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden group"
              >
                {/* Image */}
                <div
                  className="relative h-48 cursor-pointer"
                  onClick={() => navigate(`/campsites/${item.campsite.id}`)}
                >
                  <img
                    src={item.campsite.images[0] || '/placeholder.jpg'}
                    alt={item.campsite.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(item.campsite.id);
                      }}
                      className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ₩{item.campsite.pricePerNight.toLocaleString()}/박
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3
                    className="text-lg font-bold text-gray-900 mb-2 cursor-pointer hover:text-green-600 transition"
                    onClick={() => navigate(`/campsites/${item.campsite.id}`)}
                  >
                    {item.campsite.name}
                  </h3>

                  <div className="flex items-center gap-1 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{item.campsite.location}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{item.campsite.rating}</span>
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{item.notes}</p>
                    </div>
                  )}

                  {/* Notifications */}
                  <div className="flex items-center gap-2 mb-4">
                    {item.notifyOnAvailability ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Bell className="w-4 h-4" />
                        예약 가능 시 알림
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <BellOff className="w-4 h-4" />
                        알림 꺼짐
                      </span>
                    )}
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.campsite.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {item.campsite.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{item.campsite.amenities.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/booking/${item.campsite.id}`)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                    >
                      예약하기
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">메모 수정</h2>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="이 캠프장에 대한 메모를 남겨보세요"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify"
                  checked={editNotify}
                  onChange={(e) => setEditNotify(e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <label htmlFor="notify" className="text-sm text-gray-700 cursor-pointer">
                  예약 가능할 때 알림 받기
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  onClick={updateWishlistItem}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWishlist;
