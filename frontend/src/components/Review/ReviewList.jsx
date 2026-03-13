import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../translet/LanguageContext";
import reviewService from "../../services/reviewService";
import ReviewItem from "./ReviewItem";
import ReviewForm from "./ReviewForm";
import styles from "./Review.module.css";
import { FaStar } from "react-icons/fa";

const ReviewList = ({ revieweeId, showForm = false, jobApplicationId = null }) => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!revieweeId) return;
    
    try {
      setLoading(true);
      const response = await reviewService.getReviewsByRevieweeId(revieweeId, page, 10);
      if (page === 1) {
        setReviews(response.data || []);
        // Calculate average rating from all reviews on first page
        if (response.data && response.data.length > 0) {
          const allRatings = response.data.map((r) => r.rating);
          const avg = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
          setAverageRating(avg);
        } else {
          setAverageRating(0);
        }
      } else {
        setReviews((prev) => [...prev, ...(response.data || [])]);
      }
      setHasMore(response.pagination?.page < response.pagination?.totalPages);
      setTotalReviews(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [revieweeId, page]);

  useEffect(() => {
    if (revieweeId) {
      fetchReviews();
    }
  }, [revieweeId, page, fetchReviews]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleReviewAdded = () => {
    setPage(1);
    fetchReviews();
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={`${styles.star} ${i < Math.round(rating) ? styles.starFilled : styles.starEmpty}`}
      />
    ));
  };

  if (loading && page === 1) {
    return <div className={styles.loading}>{t("reviews.loading") || "Loading reviews..."}</div>;
  }

  return (
    <div className={styles.reviewList}>
      {totalReviews > 0 && (
        <div className={styles.reviewSummary}>
          <div className={styles.ratingDisplay}>
            <span className={styles.averageRating}>{averageRating.toFixed(1)}</span>
            <div className={styles.starsContainer}>
              {renderStars(averageRating)}
            </div>
            <span className={styles.totalReviews}>
              ({totalReviews} {t("reviews.totalReviews") || "reviews"})
            </span>
          </div>
        </div>
      )}

      {showForm && (
        <ReviewForm
          revieweeId={revieweeId}
          jobApplicationId={jobApplicationId}
          onReviewAdded={handleReviewAdded}
        />
      )}

      {reviews.length === 0 ? (
        <div className={styles.noReviews}>
          {t("reviews.noReviews") || "No reviews yet"}
        </div>
      ) : (
        <>
          <div className={styles.reviewsContainer}>
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} onUpdate={handleReviewAdded} />
            ))}
          </div>
          {hasMore && (
            <button className={styles.loadMoreBtn} onClick={handleLoadMore}>
              {t("reviews.loadMore") || "Load more reviews"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewList;

