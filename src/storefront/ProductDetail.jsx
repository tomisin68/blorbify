import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { StoreIcon } from './icons';
import { getProductImages } from '../productImages';
import { isProductAvailable } from './storefrontUtils';
import StarRating from './StarRating';

const emptyReviewForm = { rating: 0, customerName: '', comment: '' };

export default function ProductDetail({ product, categoryLabel, deliveryFee, isWished, addLabel, formatCurrency, onClose, onAddToCart, onToggleWish, shareUrl, storeSlug }) {
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackedKey, setTrackedKey] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const productKey = product ? (product.id || product.imageUrl) : null;
  if (productKey !== trackedKey) {
    setTrackedKey(productKey);
    setActiveIndex(0);
    setQuantity(1);
    setLinkCopied(false);
    setReviews([]);
    setReviewsLoading(Boolean(productKey && storeSlug));
    setReviewForm(emptyReviewForm);
    setReviewError('');
    setReviewSuccess('');
  }

  useEffect(() => {
    if (!productKey || !storeSlug) return undefined;

    let active = true;
    const reviewsQuery = query(collection(db, 'publicStores', storeSlug, 'reviews'), where('productId', '==', productKey));
    getDocs(reviewsQuery)
      .then((snapshot) => {
        if (!active) return;
        const docs = snapshot.docs
          .map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() }))
          .filter((review) => !review.hidden)
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setReviews(docs);
      })
      .catch((error) => {
        console.error('Reviews load failed:', error);
        setReviews([]);
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productKey, storeSlug]);

  // Lock background scroll while the modal is open — otherwise touch-scrolling the modal
  // on mobile also scrolls the storefront page behind it.
  useEffect(() => {
    if (!product) return undefined;

    const { body, documentElement: html } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [product]);

  if (!product) return null;

  const images = getProductImages(product);
  const activeImage = images[activeIndex] || images[0];
  const isDigital = product.type === 'digital';
  const stock = Number(product.stock || 0);
  const outOfStock = !isProductAvailable(product);
  const maxQuantity = isDigital ? Infinity : stock;

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Copy product link failed:', error);
    }
  };

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    const name = reviewForm.customerName.trim();
    const comment = reviewForm.comment.trim();

    if (!reviewForm.rating) {
      setReviewError('Select a star rating.');
      return;
    }
    if (!name) {
      setReviewError('Enter your name.');
      return;
    }
    if (!comment) {
      setReviewError('Write a short comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      const newReview = {
        productId: productKey,
        productName: product.name,
        rating: reviewForm.rating,
        comment,
        customerName: name,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'publicStores', storeSlug, 'reviews'), newReview);
      setReviews((current) => [{ ...newReview, id: `local-${Date.now()}`, createdAt: { toMillis: () => Date.now() } }, ...current]);
      setReviewForm(emptyReviewForm);
      setReviewSuccess('Thanks for your review!');
    } catch (error) {
      console.error('Review submission failed:', error);
      setReviewError('Your review could not be submitted — please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="pdetail-modal" role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="pdetail-overlay" onClick={onClose} />
      <div className="pdetail-panel">
        <button type="button" className="pdetail-close" onClick={onClose} aria-label="Close product details">
          <StoreIcon name="close" size={18} />
        </button>
        <div className="pdetail-gallery">
          <div className="pdetail-media">
            {activeImage && <img src={activeImage.url} alt={product.name} />}
          </div>
          {images.length > 1 && (
            <div className="pdetail-thumbs" role="tablist" aria-label={`${product.name} photos`}>
              {images.map((image, index) => (
                <button
                  key={image.url + index}
                  type="button"
                  className={`pdetail-thumb ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-selected={index === activeIndex}
                  role="tab"
                >
                  <img src={image.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pdetail-copy">
          <span className="pdetail-eyebrow">{product.category || categoryLabel}</span>
          <h2>{product.name}</h2>
          <div className="pdetail-price">{formatCurrency(product.price)}</div>
          {product.description && <p className="pdetail-desc">{product.description}</p>}

          <div className="pdetail-meta">
            <div>
              <span>Availability</span>
              <b>{isDigital ? 'Instant download' : (outOfStock ? 'Out of stock' : `${stock} in stock`)}</b>
            </div>
            <div>
              <span>Delivery</span>
              <b>{isDigital ? 'Emailed to you' : formatCurrency(deliveryFee)}</b>
            </div>
          </div>

          {!outOfStock && (
            <div className="pdetail-qty">
              <span>Quantity</span>
              <div className="qty-stepper">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><StoreIcon name="minus" size={13} /></button>
                <b>{quantity}</b>
                <button type="button" onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} aria-label="Increase quantity"><StoreIcon name="plus" size={13} /></button>
              </div>
            </div>
          )}

          <div className="pdetail-actions">
            <button
              type="button"
              className="store-cta"
              disabled={outOfStock}
              onClick={() => { onAddToCart(quantity); onClose(); }}
            >
              <StoreIcon name="bag" size={16} />
              {outOfStock ? 'Sold out' : addLabel}
            </button>
            <button type="button" className="store-cta secondary" onClick={onToggleWish}>
              <StoreIcon name="heart" size={16} />
              {isWished ? 'Saved' : 'Save for later'}
            </button>
            <button type="button" className="store-cta secondary" onClick={handleCopyLink} disabled={!shareUrl}>
              <StoreIcon name={linkCopied ? 'check' : 'link'} size={16} />
              {linkCopied ? 'Link copied!' : 'Copy product link'}
            </button>
          </div>

          {storeSlug && (
            <div className="pdetail-reviews">
              <div className="pdetail-reviews-head">
                <h3>Reviews</h3>
                {reviews.length > 0 && (
                  <span className="pdetail-reviews-summary">
                    <StarRating value={averageRating} size={14} /> {averageRating.toFixed(1)} ({reviews.length})
                  </span>
                )}
              </div>

              {reviewsLoading ? (
                <p className="pdetail-reviews-empty">Loading reviews…</p>
              ) : reviews.length > 0 ? (
                <div className="pdetail-reviews-list">
                  {reviews.map((review) => (
                    <div className="pdetail-review" key={review.id}>
                      <div className="pdetail-review-head">
                        <StarRating value={review.rating} size={13} />
                        <strong>{review.customerName}</strong>
                      </div>
                      <p>{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pdetail-reviews-empty">No reviews yet — be the first to share your experience.</p>
              )}

              <form className="pdetail-review-form" onSubmit={handleSubmitReview}>
                <span className="pdetail-review-form-label">Leave a review</span>
                <StarRating
                  value={reviewForm.rating}
                  size={20}
                  onChange={(rating) => setReviewForm((current) => ({ ...current, rating }))}
                />
                <input
                  value={reviewForm.customerName}
                  onChange={(event) => setReviewForm((current) => ({ ...current, customerName: event.target.value }))}
                  placeholder="Your name"
                />
                <textarea
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Share what you thought of this product"
                  rows={3}
                />
                {reviewError && <p className="pdetail-review-alert error">{reviewError}</p>}
                {reviewSuccess && <p className="pdetail-review-alert success">{reviewSuccess}</p>}
                <button type="submit" className="store-cta secondary" disabled={submittingReview}>
                  {submittingReview ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
