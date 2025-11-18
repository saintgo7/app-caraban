import React from 'react';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title: string;
    content: string;
    images?: string[];
    isVerified: boolean;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
    ownerReply?: string;
    ownerReplyDate?: string;
    helpfulCount: number;
  };
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onMarkHelpful, onReport }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xl">{renderStars(review.rating)}</div>
            {review.isVerified && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                ✓ 실제 투숙 인증
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2">{review.title}</h3>

          <p className="text-gray-700 mb-3">{review.content}</p>

          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {review.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Review image ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
            <span>
              {review.user.firstName} {review.user.lastName}
            </span>
            <span>•</span>
            <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>

          {review.ownerReply && (
            <div className="bg-gray-50 rounded p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">사업자 답변</span>
                {review.ownerReplyDate && (
                  <span className="text-xs text-gray-500">
                    {new Date(review.ownerReplyDate).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{review.ownerReply}</p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {onMarkHelpful && (
              <button
                onClick={() => onMarkHelpful(review.id)}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <span>👍</span>
                <span>도움이 돼요 ({review.helpfulCount})</span>
              </button>
            )}
            {onReport && (
              <button
                onClick={() => onReport(review.id)}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                신고
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
