import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { favoriteService, Favorite } from '../services/campingService';
import { useNavigate } from 'react-router-dom';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const typeLabels: Record<string, string> = {
    auto: '오토캠핑',
    glamping: '글램핑',
    caravan: '카라반',
    general: '일반야영장',
  };

  useEffect(() => {
    fetchFavorites();
  }, [currentPage]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoriteService.getMyFavorites({
        page: currentPage,
        limit: 12,
      });
      setFavorites(response.data.data.favorites);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (campsiteId: string) => {
    if (!confirm('즐겨찾기에서 제거하시겠습니까?')) {
      return;
    }

    try {
      await favoriteService.remove(campsiteId);
      alert('즐겨찾기에서 제거되었습니다');
      fetchFavorites();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('즐겨찾기 제거 중 오류가 발생했습니다');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">즐겨찾기</h1>
        <Button onClick={() => navigate('/campsites')}>캠핑장 찾기</Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">즐겨찾기를 불러오는 중...</p>
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              즐겨찾기한 캠핑장이 없습니다
            </p>
            <Button onClick={() => navigate('/campsites')}>캠핑장 찾기</Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              if (!favorite.campsite) return null;

              const campsite = favorite.campsite;
              const images = parseImages(campsite.images);
              const amenities = parseAmenities(campsite.amenities);

              return (
                <Card key={favorite.id} className="relative">
                  <div className="space-y-3">
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(campsite.id);
                      }}
                      className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <span className="text-xl">❤️</span>
                    </button>

                    {/* Image */}
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/campsites/${campsite.id}`)}
                    >
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={campsite.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">이미지 없음</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/campsites/${campsite.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {campsite.name}
                        </h3>
                        <Badge variant="primary" size="sm">
                          {typeLabels[campsite.type]}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {campsite.address}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-sm font-medium">
                          {campsite.rating
                            ? campsite.rating.toFixed(1)
                            : '평가없음'}
                        </span>
                        {campsite.reviewCount > 0 && (
                          <span className="text-sm text-gray-500 ml-1">
                            ({campsite.reviewCount})
                          </span>
                        )}
                      </div>

                      {/* Amenities */}
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {amenities.slice(0, 3).map((amenity, index) => (
                            <Badge key={index} variant="gray" size="sm">
                              {amenity}
                            </Badge>
                          ))}
                          {amenities.length > 3 && (
                            <Badge variant="gray" size="sm">
                              +{amenities.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Price and Capacity */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div>
                          <span className="text-sm text-gray-600">
                            최대 {campsite.maxCapacity}명
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary-600">
                            {formatPrice(campsite.pricePerNight)}
                          </span>
                          <span className="text-sm text-gray-500">/박</span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <Button
                      onClick={() => navigate(`/campsites/${campsite.id}`)}
                      className="w-full"
                      size="sm"
                    >
                      상세보기
                    </Button>
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

export default Favorites;
