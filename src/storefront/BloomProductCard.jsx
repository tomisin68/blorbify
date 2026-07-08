import { StoreIcon } from './icons';
import { isProductAvailable } from './storefrontUtils';

export default function BloomProductCard({ product, categoryLabel, isWished, addLabel, formatCurrency, onSelect, onAddToCart, onToggleWish }) {
  const stock = Number(product.stock || 0);
  const outOfStock = !isProductAvailable(product);
  const lowStock = stock > 0 && stock <= 5;

  return (
    <article className="bloom-card">
      <div className="bloom-card-media" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {outOfStock && <span className="bloom-badge out">Sold out</span>}
        {!outOfStock && lowStock && <span className="bloom-badge low">{stock} left</span>}
        <button
          type="button"
          className={`bloom-wish ${isWished ? 'active' : ''}`}
          onClick={(event) => { event.stopPropagation(); onToggleWish(); }}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <StoreIcon name="heart" size={15} />
        </button>
      </div>
      <div className="bloom-card-body">
        <p className="bloom-card-cat">{product.category || categoryLabel}</p>
        <h3 className="bloom-card-name" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>{product.name}</h3>
        <div className="bloom-card-row">
          <span className="bloom-card-price">{formatCurrency(product.price)}</span>
          <button
            type="button"
            className="bloom-card-add"
            onClick={() => onAddToCart()}
            disabled={outOfStock}
            aria-label={outOfStock ? 'Sold out' : addLabel}
          >
            <StoreIcon name={outOfStock ? 'close' : 'plus'} size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
