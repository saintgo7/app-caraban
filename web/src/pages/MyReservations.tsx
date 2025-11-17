import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Select from '../components/Select';
import { reservationService, Reservation } from '../services/campingService';
import { useNavigate } from 'react-router-dom';

const MyReservations: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'pending', label: '대기중' },
    { value: 'confirmed', label: '확정됨' },
    { value: 'cancelled', label: '취소됨' },
    { value: 'completed', label: '완료됨' },
  ];

  const statusLabels: Record<string, string> = {
    pending: '대기중',
    confirmed: '확정됨',
    cancelled: '취소됨',
    completed: '완료됨',
  };

  const statusVariants: Record<
    string,
    'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
  > = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger',
    completed: 'gray',
  };

  const paymentStatusLabels: Record<string, string> = {
    pending: '결제대기',
    paid: '결제완료',
    refunded: '환불완료',
  };

  const paymentStatusVariants: Record<
    string,
    'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
  > = {
    pending: 'warning',
    paid: 'success',
    refunded: 'info',
  };

  useEffect(() => {
    fetchReservations();
  }, [currentPage, statusFilter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter) params.status = statusFilter;

      const response = await reservationService.getMyReservations(params);
      setReservations(response.data.data.reservations);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm('정말로 이 예약을 취소하시겠습니까?')) {
      return;
    }

    try {
      await reservationService.cancel(id);
      alert('예약이 취소되었습니다');
      fetchReservations();
    } catch (error: any) {
      console.error('Failed to cancel reservation:', error);
      alert(
        error.response?.data?.message ||
          '예약 취소 중 오류가 발생했습니다'
      );
    }
  };

  const parseImages = (images?: string): string[] => {
    if (!images) return [];
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">내 예약 내역</h1>
      </div>

      <Card>
        <div className="flex justify-between items-center">
          <Select
            label="상태 필터"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-48"
          />
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">예약 정보를 불러오는 중...</p>
        </div>
      ) : reservations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">예약 내역이 없습니다</p>
            <Button onClick={() => navigate('/campsites')}>캠핑장 찾기</Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reservations.map((reservation) => {
              const images = parseImages(reservation.campsite?.images);
              const nights = calculateNights(
                reservation.checkInDate,
                reservation.checkOutDate
              );

              return (
                <Card key={reservation.id}>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={reservation.campsite?.name}
                          className="w-full md:w-48 h-48 object-cover rounded-lg cursor-pointer"
                          onClick={() =>
                            navigate(`/campsites/${reservation.campsiteId}`)
                          }
                        />
                      ) : (
                        <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">이미지 없음</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3
                            className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-primary-600"
                            onClick={() =>
                              navigate(`/campsites/${reservation.campsiteId}`)
                            }
                          >
                            {reservation.campsite?.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {reservation.campsite?.address}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={statusVariants[reservation.status]}>
                            {statusLabels[reservation.status]}
                          </Badge>
                          <Badge
                            variant={paymentStatusVariants[reservation.paymentStatus]}
                          >
                            {paymentStatusLabels[reservation.paymentStatus]}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">체크인</p>
                          <p className="font-medium">
                            {formatDate(reservation.checkInDate)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {reservation.campsite?.checkInTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">체크아웃</p>
                          <p className="font-medium">
                            {formatDate(reservation.checkOutDate)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {reservation.campsite?.checkOutTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">인원</p>
                          <p className="font-medium">{reservation.guestCount}명</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">숙박일수</p>
                          <p className="font-medium">{nights}박</p>
                        </div>
                      </div>

                      {reservation.specialRequests && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">특별 요청사항</p>
                          <p className="text-sm text-gray-700">
                            {reservation.specialRequests}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div>
                          <p className="text-sm text-gray-600">총 금액</p>
                          <p className="text-2xl font-bold text-primary-600">
                            {formatPrice(reservation.totalPrice)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {reservation.status === 'pending' ||
                          reservation.status === 'confirmed' ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCancelReservation(reservation.id)}
                            >
                              예약 취소
                            </Button>
                          ) : null}
                          {reservation.status === 'completed' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/campsites/${reservation.campsiteId}/review?reservationId=${reservation.id}`
                                )
                              }
                            >
                              리뷰 작성
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              <span className="flex items-center px-4">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyReservations;
