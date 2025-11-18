import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    newThisMonth: number;
  };
  reviews: {
    total: number;
    pending: number;
    averageRating: string;
    ratingDistribution: Array<{ rating: number; count: number }>;
    recentCount: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${apiUrl}/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || '통계를 불러오는데 실패했습니다');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">관리자 대시보드</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-2">전체 사용자</div>
            <div className="text-3xl font-bold">{stats.users.total.toLocaleString()}</div>
            <div className="text-sm text-green-600 mt-2">
              오늘 +{stats.users.newToday} | 이번 달 +{stats.users.newThisMonth}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-2">전체 리뷰</div>
            <div className="text-3xl font-bold">{stats.reviews.total.toLocaleString()}</div>
            <div className="text-sm text-blue-600 mt-2">
              최근 30일: {stats.reviews.recentCount}개
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-2">평균 평점</div>
            <div className="text-3xl font-bold flex items-center">
              {stats.reviews.averageRating}
              <span className="text-yellow-500 ml-2">★</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-2">대기 중인 리뷰</div>
            <div className="text-3xl font-bold text-orange-600">{stats.reviews.pending}</div>
            <div className="text-sm text-gray-500 mt-2">검토 필요</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">평점 분포</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const data = stats.reviews.ratingDistribution.find((r) => r.rating === rating);
              const count = data ? parseInt(data.count as any) : 0;
              const percentage =
                stats.reviews.total > 0 ? (count / stats.reviews.total) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="w-16 text-sm text-gray-600">
                    {rating}★
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-yellow-500 h-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-sm text-gray-600 text-right">
                    {count}개 ({percentage.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold mb-2">사용자 관리</h3>
            <p className="text-gray-600 text-sm">
              사용자 목록 조회 및 권한 관리
            </p>
          </a>

          <a
            href="/admin/reviews"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold mb-2">리뷰 관리</h3>
            <p className="text-gray-600 text-sm">
              리뷰 승인 및 신고 처리
            </p>
          </a>

          <a
            href="/admin/system"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold mb-2">시스템 상태</h3>
            <p className="text-gray-600 text-sm">
              서버 및 데이터베이스 모니터링
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
