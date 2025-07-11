import React, { useState, useEffect } from 'react';
import { FaStar, FaThumbsUp, FaThumbsDown, FaUser, FaCalendar, FaSpinner } from 'react-icons/fa';
import { API_URL, ENDPOINTS } from '../config/api';
import './RatingSystem.css';

const RatingSystem = ({ 
  taskId,
  userId, 
  userType = 'freelancer', // 'freelancer' or 'task_poster'
  onRatingSubmit,
  readOnly = false,
  showReviews = true
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (userId) {
      loadReviews();
    }
  }, [userId, currentPage]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.RATINGS_USER(userId)}?page=${currentPage}&limit=5`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.ratings || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalRatings || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error('Failed to load reviews');
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !taskId) return;

    setSubmitting(true);
    try {
      const reviewData = {
        rating,
        review: review.trim(),
        revieweeId: userId
      };

      const response = await fetch(`${API_URL}${ENDPOINTS.RATINGS_TASK(taskId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        const newReview = await response.json();
        
        // Refresh reviews
        await loadReviews();

        // Reset form
        setRating(0);
        setReview('');

        if (onRatingSubmit) {
          onRatingSubmit(newReview);
        }
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (ratingId) => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.RATINGS_HELPFUL(ratingId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update the helpful count in the local state
        setReviews(reviews.map(r => 
          r._id === ratingId ? { ...r, helpfulVotes: data.helpfulVotes } : r
        ));
      }
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return texts[rating] || '';
  };

  const getRatingColor = (rating) => {
    const colors = {
      1: '#ef4444',
      2: '#f97316',
      3: '#eab308',
      4: '#22c55e',
      5: '#10b981'
    };
    return colors[rating] || '#6b7280';
  };

  const hasUserVoted = (rating) => {
    const user = JSON.parse(localStorage.getItem('user'));
    return rating.helpfulVotes?.some(vote => vote.user === user.id);
  };

  if (loading) {
    return (
      <div className="rating-system">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rating-system">
      {/* Rating Summary */}
      <div className="rating-summary">
        <div className="rating-overview">
          <div className="average-rating">
            <span className="rating-number">{averageRating.toFixed(1)}</span>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`star ${star <= averageRating ? 'filled' : ''}`}
                  style={{ color: star <= averageRating ? getRatingColor(Math.round(averageRating)) : '#d1d5db' }}
                />
              ))}
            </div>
          </div>
          <div className="rating-stats">
            <p className="total-reviews">{totalReviews} reviews</p>
            <p className="user-type">{userType === 'freelancer' ? 'Freelancer' : 'Task Poster'}</p>
          </div>
        </div>
      </div>

      {/* Rating Form */}
      {!readOnly && taskId && (
        <div className="rating-form">
          <h3>Write a Review</h3>
          <form onSubmit={handleRatingSubmit}>
            <div className="rating-input">
              <label>Your Rating:</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
                    style={{ 
                      color: star <= (hover || rating) ? getRatingColor(star) : '#d1d5db',
                      cursor: 'pointer'
                    }}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  />
                ))}
              </div>
              {rating > 0 && (
                <span className="rating-text">{getRatingText(rating)}</span>
              )}
            </div>

            <div className="review-input">
              <label>Your Review:</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience working with this user..."
                rows="4"
                maxLength="1000"
              />
              <span className="char-count">{review.length}/1000</span>
            </div>

            <button 
              type="submit" 
              className="submit-review-btn"
              disabled={rating === 0 || submitting}
            >
              {submitting ? <FaSpinner className="spinner" /> : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {showReviews && (
        <div className="reviews-section">
          <h3>Reviews ({totalReviews})</h3>
          
          {reviews.length === 0 ? (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to review this user!</p>
            </div>
          ) : (
            <>
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        {review.reviewer.profilePicture ? (
                          <img 
                            src={`${API_URL}${review.reviewer.profilePicture}`} 
                            alt={review.reviewer.name}
                            className="reviewer-avatar"
                          />
                        ) : (
                          <FaUser className="reviewer-avatar-placeholder" />
                        )}
                        <div className="reviewer-details">
                          <span className="reviewer-name">{review.reviewer.name}</span>
                          <span className="review-date">
                            <FaCalendar /> {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="review-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={`star ${star <= review.rating ? 'filled' : ''}`}
                              style={{ color: star <= review.rating ? getRatingColor(review.rating) : '#d1d5db' }}
                            />
                          ))}
                        </div>
                        <span className="rating-text">{getRatingText(review.rating)}</span>
                      </div>
                    </div>
                    
                    {review.review && (
                      <div className="review-content">
                        <p>{review.review}</p>
                      </div>
                    )}
                    
                    <div className="review-actions">
                      <button 
                        className={`helpful-btn ${hasUserVoted(review) ? 'voted' : ''}`}
                        onClick={() => markHelpful(review._id)}
                      >
                        <FaThumbsUp />
                        Helpful ({review.helpfulVotes?.length || 0})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingSystem; 