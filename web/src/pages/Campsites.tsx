import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { campsiteService, Campsite } from '../services/campingService';
import { useNavigate } from 'react-router-dom';

const Campsites: React.FC = () => {
  const navigate = useNavigate();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const typeOptions = [
    { value: '', label: '전체 타입' },
    { value: 'auto', label: '오토캠핑' },
    { value: 'glamping', label: '글램핑' },
    { value: 'caravan', label: '카라반' },
    { value: 'general', label: '일반야영장' },
  ];

  const typeLabels: Record<string, string> = {
    auto: '오토캠핑',
    glamping: '글램핑',
    caravan: '카라반',
    general: '일반야영장',
  };

  const fetchCampsites = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 12,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterType) params.type = filterType;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);

      const response = await campsiteService.getAll(params);
      setCampsites(response.data.data.campsites);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch campsites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampsites();
  }, [currentPage, filterType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCampsites();
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterType('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
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
        <h1 className="text-3xl font-bold text-gray-900">캠핑장 찾기</h1>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="검색"
              type="text"
              placeholder="캠핑장 이름, 주소 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select
              label="캠핑장 타입"
              options={typeOptions}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            />

            <Input
              label="최소 금액 (₩)"
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />

            <Input
              label="최대 금액 (₩)"
              type="number"
              placeholder="1,000,000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">검색</Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              초기화
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">캠핑장 정보를 불러오는 중...</p>
        </div>
      ) : campsites.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campsites.map((campsite) => {
              const images = parseImages(campsite.images);
              const amenities = parseAmenities(campsite.amenities);

              return (
                <Card
                  key={campsite.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/campsites/${campsite.id}`)}
                >
                  <div className="space-y-3">
                    {/* Image */}
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

                    {/* Content */}
                    <div>
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

export default Campsites;
