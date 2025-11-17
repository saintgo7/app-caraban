import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import {
  campsiteService,
  reservationService,
  reviewService,
  favoriteService,
  Campsite,
  Review,
} from '../services/campingService';

const CampsiteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationData, setReservationData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestCount: 1,
    specialRequests: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCampsiteDetails();
      fetchReviews();
      checkFavoriteStatus();
    }
  }, [id]);

  const fetchCampsiteDetails = async () => {
    try {
      const response = await campsiteService.getById(id!);
      setCampsite(response.data.data.campsite);
    } catch (error) {
      console.error('Failed to fetch campsite:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewService.getByCampsite(id!, { limit: 5 });
      setReviews(response.data.data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteService.check(id!);
      setIsFavorite(response.data.data.isFavorite);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoriteService.remove(id!);
        setIsFavorite(false);
      } else {
        await favoriteService.add(id!);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('즐겨찾기 처리에 실패했습니다');
    }
  };

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check availability first
      const availabilityResponse = await reservationService.checkAvailability({
        campsiteId: id!,
        checkInDate: reservationData.checkInDate,
        checkOutDate: reservationData.checkOutDate,
      });

      if (!availabilityResponse.data.data.isAvailable) {
        alert(availabilityResponse.data.data.message);
        return;
      }

      // Create reservation
      await reservationService.create({
        campsiteId: id!,
        ...reservationData,
      });

      alert('예약이 성공적으로 완료되었습니다!');
      setShowReservationModal(false);
      navigate('/my-reservations');
    } catch (error: any) {
      console.error('Failed to create reservation:', error);
      alert(
        error.response?.data?.message ||
          '예약 처리 중 오류가 발생했습니다'
      );
    } finally {
      setSubmitting(false);
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

  const parseAmenities = (amenities?: string): string[] => {
    if (!amenities) return [];
    try {
      return JSON.parse(amenities);
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

  const calculateTotalPrice = () => {
    if (!campsite || !reservationData.checkInDate || !reservationData.checkOutDate) {
      return 0;
    }
    const checkIn = new Date(reservationData.checkInDate);
    const checkOut = new Date(reservationData.checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights * campsite.pricePerNight;
  };

  const typeLabels: Record<string, string> = {
    auto: '오토캠핑',
    glamping: '글램핑',
    caravan: '카라반',
    general: '일반야영장',
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">캠핑장 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!campsite) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">캠핑장을 찾을 수 없습니다</p>
          <Button onClick={() => navigate('/campsites')} className="mt-4">
            목록으로 돌아가기
          </Button>
        </div>
      </Card>
    );
  }

  const images = parseImages(campsite.images);
  const amenities = parseAmenities(campsite.amenities);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{campsite.name}</h1>
            <Badge variant="primary">{typeLabels[campsite.type]}</Badge>
          </div>
          <p className="text-gray-600">{campsite.address}</p>
        </div>
        <Button
          variant={isFavorite ? 'danger' : 'outline'}
          onClick={handleToggleFavorite}
        >
          {isFavorite ? '❤️ 즐겨찾기 제거' : '🤍 즐겨찾기 추가'}
        </Button>
      </div>

      {/* Images Gallery */}
      {images.length > 0 && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${campsite.name} ${index + 1}`}
                className="w-full h-64 object-cover rounded-lg"
              />
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">캠핑장 소개</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {campsite.description || '소개 내용이 없습니다'}
            </p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">편의시설</h2>
            {amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity, index) => (
                  <Badge key={index} variant="gray">
                    {amenity}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">등록된 편의시설이 없습니다</p>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">이용 시간</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">체크인</p>
                <p className="text-lg font-medium">{campsite.checkInTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">체크아웃</p>
                <p className="text-lg font-medium">{campsite.checkOutTime}</p>
              </div>
            </div>
          </Card>

          {/* Reviews */}
          <Card>
            <h2 className="text-xl font-semibold mb-4">리뷰</h2>
            {campsite.rating && (
              <div className="flex items-center mb-4 pb-4 border-b">
                <span className="text-4xl font-bold mr-2">
                  {campsite.rating.toFixed(1)}
                </span>
                <div>
                  <div className="flex items-center text-yellow-500">
                    {'★'.repeat(Math.round(campsite.rating))}
                    {'☆'.repeat(5 - Math.round(campsite.rating))}
                  </div>
                  <p className="text-sm text-gray-600">
                    {campsite.reviewCount}개의 리뷰
                  </p>
                </div>
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{review.title}</p>
                        <p className="text-sm text-gray-600">
                          {review.user?.firstName} {review.user?.lastName}
                        </p>
                      </div>
                      <div className="flex items-center text-yellow-500">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.content}</p>
                    {review.ownerReply && (
                      <div className="mt-2 ml-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          사장님 답변
                        </p>
                        <p className="text-sm text-gray-700">{review.ownerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">등록된 리뷰가 없습니다</p>
            )}
          </Card>
        </div>

        {/* Reservation Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <p className="text-3xl font-bold text-primary-600">
                  {formatPrice(campsite.pricePerNight)}
                </p>
                <p className="text-sm text-gray-600">/박</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">최대 수용 인원</p>
                <p className="text-lg font-medium">{campsite.maxCapacity}명</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">운영자</p>
                <p className="text-lg font-medium">
                  {campsite.owner?.firstName} {campsite.owner?.lastName}
                </p>
              </div>

              <Button
                onClick={() => setShowReservationModal(true)}
                className="w-full"
                size="lg"
              >
                예약하기
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Reservation Modal */}
      <Modal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        title="캠핑장 예약"
      >
        <form onSubmit={handleReservation} className="space-y-4">
          <Input
            label="체크인 날짜"
            type="date"
            required
            value={reservationData.checkInDate}
            onChange={(e) =>
              setReservationData({ ...reservationData, checkInDate: e.target.value })
            }
            min={new Date().toISOString().split('T')[0]}
          />

          <Input
            label="체크아웃 날짜"
            type="date"
            required
            value={reservationData.checkOutDate}
            onChange={(e) =>
              setReservationData({ ...reservationData, checkOutDate: e.target.value })
            }
            min={reservationData.checkInDate || new Date().toISOString().split('T')[0]}
          />

          <Input
            label="인원 수"
            type="number"
            required
            min={1}
            max={campsite.maxCapacity}
            value={reservationData.guestCount}
            onChange={(e) =>
              setReservationData({
                ...reservationData,
                guestCount: parseInt(e.target.value),
              })
            }
          />

          <Input
            label="특별 요청사항"
            type="text"
            placeholder="특별한 요청사항이 있으시면 입력해주세요"
            value={reservationData.specialRequests}
            onChange={(e) =>
              setReservationData({
                ...reservationData,
                specialRequests: e.target.value,
              })
            }
          />

          {calculateTotalPrice() > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">총 금액</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatPrice(calculateTotalPrice())}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" loading={submitting} className="flex-1">
              예약 확정
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReservationModal(false)}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CampsiteDetail;
