import api from './api';

export interface Campsite {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'auto' | 'glamping' | 'caravan' | 'general';
  maxCapacity: number;
  pricePerNight: number;
  checkInTime: string;
  checkOutTime: string;
  amenities?: string;
  images?: string;
  rating?: number;
  reviewCount: number;
  ownerId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Reservation {
  id: string;
  campsiteId: string;
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  specialRequests?: string;
  createdAt?: Date;
  updatedAt?: Date;
  campsite?: Campsite;
}

export interface Review {
  id: string;
  campsiteId: string;
  userId: string;
  reservationId?: string;
  rating: number;
  title: string;
  content: string;
  images?: string;
  ownerReply?: string;
  ownerReplyDate?: Date;
  isVisible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface Favorite {
  id: string;
  userId: string;
  campsiteId: string;
  createdAt?: Date;
  campsite?: Campsite;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// Campsite Services
export const campsiteService = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) => api.get<PaginatedResponse<Campsite>>('/campsites', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: { campsite: Campsite } }>(
      `/campsites/${id}`
    ),

  create: (data: Partial<Campsite>) =>
    api.post<{ success: boolean; message: string; data: { campsite: Campsite } }>(
      '/campsites',
      data
    ),

  update: (id: string, data: Partial<Campsite>) =>
    api.put<{ success: boolean; message: string; data: { campsite: Campsite } }>(
      `/campsites/${id}`,
      data
    ),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/campsites/${id}`),

  getMyCampsites: () =>
    api.get<{ success: boolean; data: { campsites: Campsite[] } }>(
      '/campsites/owner/my-campsites'
    ),
};

// Reservation Services
export const reservationService = {
  create: (data: {
    campsiteId: string;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
    specialRequests?: string;
  }) =>
    api.post<{ success: boolean; message: string; data: { reservation: Reservation } }>(
      '/reservations',
      data
    ),

  getMyReservations: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Reservation>>('/reservations/my-reservations', {
      params,
    }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: { reservation: Reservation } }>(
      `/reservations/${id}`
    ),

  checkAvailability: (params: {
    campsiteId: string;
    checkInDate: string;
    checkOutDate: string;
  }) =>
    api.get<{ success: boolean; data: { isAvailable: boolean; message: string } }>(
      '/reservations/check-availability',
      { params }
    ),

  cancel: (id: string) =>
    api.post<{ success: boolean; message: string; data: { reservation: Reservation } }>(
      `/reservations/${id}/cancel`
    ),

  updateStatus: (
    id: string,
    data: { status?: string; paymentStatus?: string; paymentMethod?: string }
  ) =>
    api.patch<{ success: boolean; message: string; data: { reservation: Reservation } }>(
      `/reservations/${id}/status`,
      data
    ),
};

// Review Services
export const reviewService = {
  create: (data: {
    campsiteId: string;
    reservationId?: string;
    rating: number;
    title: string;
    content: string;
    images?: string[];
  }) =>
    api.post<{ success: boolean; message: string; data: { review: Review } }>(
      '/reviews',
      data
    ),

  getByCampsite: (
    campsiteId: string,
    params?: { page?: number; limit?: number; rating?: number }
  ) =>
    api.get<PaginatedResponse<Review>>(`/reviews/campsite/${campsiteId}`, {
      params,
    }),

  getMyReviews: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Review>>('/reviews/my-reviews', { params }),

  update: (
    id: string,
    data: { rating?: number; title?: string; content?: string; images?: string[] }
  ) =>
    api.put<{ success: boolean; message: string; data: { review: Review } }>(
      `/reviews/${id}`,
      data
    ),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/reviews/${id}`),

  addOwnerReply: (id: string, ownerReply: string) =>
    api.post<{ success: boolean; message: string; data: { review: Review } }>(
      `/reviews/${id}/reply`,
      { ownerReply }
    ),

  getStats: (campsiteId: string) =>
    api.get<{
      success: boolean;
      data: {
        totalReviews: number;
        averageRating: number;
        ratingDistribution: { [key: number]: number };
      };
    }>(`/reviews/campsite/${campsiteId}/stats`),
};

// Favorite Services
export const favoriteService = {
  add: (campsiteId: string) =>
    api.post<{ success: boolean; message: string; data: { favorite: Favorite } }>(
      '/favorites',
      { campsiteId }
    ),

  remove: (campsiteId: string) =>
    api.delete<{ success: boolean; message: string }>(`/favorites/${campsiteId}`),

  getMyFavorites: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Favorite>>('/favorites', { params }),

  check: (campsiteId: string) =>
    api.get<{ success: boolean; data: { isFavorite: boolean } }>(
      `/favorites/check/${campsiteId}`
    ),
};
