import { StoreIcon } from './icons';
import { isProductAvailable } from './storefrontUtils';

export default function NovaProductCard({ product, categoryLabel, isWished, addLabel, formatCurrency, onSelect, onAddToCart, onToggleWish }) {
  const stock = Number(product.stock || 0);
  const outOfStock = !isProductAvailable(product);
  const lowStock = stock > 0 && stock <= 5;

  return (
    <article className="nova-card">
      <div className="nova-card-media" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {outOfStock && <span className="nova-badge out">Out of stock</span>}
        {!outOfStock && lowStock && <span className="nova-badge low">{stock} left</span>}
        <button
          type="button"
          className={`nova-wish ${isWished ? 'active' : ''}`}
          onClick={(event) => { event.stopPropagation(); onToggleWish(); }}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <StoreIcon name="heart" size={15} />
        </button>
      </div>
      <div className="nova-card-body" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
        <p className="nova-card-cat">{product.category || categoryLabel}</p>
        <h3 className="nova-card-name">{product.name}</h3>
        <div className="nova-card-row">
          <span className="nova-card-price">{formatCurrency(product.price)}</span>
          <button
            type="button"
            className="nova-card-add"
            onClick={(event) => { event.stopPropagation(); onAddToCart(); }}
            disabled={outOfStock}
          >
            {outOfStock ? 'Sold out' : addLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
