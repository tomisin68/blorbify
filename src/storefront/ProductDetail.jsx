import { useEffect, useState } from 'react';
import { StoreIcon } from './icons';
import { getProductImages } from '../productImages';

export default function ProductDetail({ product, categoryLabel, deliveryFee, isWished, addLabel, formatCurrency, onClose, onAddToCart, onToggleWish, shareUrl }) {
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackedKey, setTrackedKey] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const productKey = product ? (product.id || product.imageUrl) : null;
  if (productKey !== trackedKey) {
    setTrackedKey(productKey);
    setActiveIndex(0);
    setQuantity(1);
    setLinkCopied(false);
  }

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
  const stock = Number(product.stock || 0);
  const outOfStock = stock <= 0;

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
              <b>{outOfStock ? 'Out of stock' : `${stock} in stock`}</b>
            </div>
            <div>
              <span>Delivery</span>
              <b>{formatCurrency(deliveryFee)}</b>
            </div>
          </div>

          {!outOfStock && (
            <div className="pdetail-qty">
              <span>Quantity</span>
              <div className="qty-stepper">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><StoreIcon name="minus" size={13} /></button>
                <b>{quantity}</b>
                <button type="button" onClick={() => setQuantity((q) => Math.min(stock, q + 1))} aria-label="Increase quantity"><StoreIcon name="plus" size={13} /></button>
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
        </div>
      </div>
    </div>
  );
}
