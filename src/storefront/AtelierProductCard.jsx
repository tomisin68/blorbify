import { StoreIcon } from './icons';
import { isProductAvailable } from './storefrontUtils';

export default function AtelierProductCard({ product, categoryLabel, isWished, addLabel, formatCurrency, onSelect, onAddToCart, onToggleWish }) {
  const stock = Number(product.stock || 0);
  const outOfStock = !isProductAvailable(product);
  const lowStock = stock > 0 && stock <= 5;

  return (
    <article className="atelier-card">
      <div className="atelier-card-frame" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
        <div className="atelier-card-media">
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
          {outOfStock && <span className="atelier-badge out">Sold out</span>}
          {!outOfStock && lowStock && <span className="atelier-badge low">{stock} left</span>}
          <button
            type="button"
            className={`atelier-wish ${isWished ? 'active' : ''}`}
            onClick={(event) => { event.stopPropagation(); onToggleWish(); }}
            aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          >
            <StoreIcon name="heart" size={15} />
          </button>
        </div>
        <p className="atelier-card-caption">{product.category || categoryLabel}</p>
      </div>
      <div className="atelier-card-body">
        <h3 className="atelier-card-name" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>{product.name}</h3>
        <div className="atelier-card-row">
          <span className="atelier-card-price">{formatCurrency(product.price)}</span>
          <button type="button" className="atelier-card-add" onClick={() => onAddToCart()} disabled={outOfStock}>
            {outOfStock ? 'Sold out' : addLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
