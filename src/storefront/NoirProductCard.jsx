import { StoreIcon } from './icons';
import { isProductAvailable } from './storefrontUtils';

export default function NoirProductCard({ product, categoryLabel, isWished, addLabel, formatCurrency, onSelect, onAddToCart, onToggleWish }) {
  const stock = Number(product.stock || 0);
  const outOfStock = !isProductAvailable(product);
  const lowStock = stock > 0 && stock <= 5;

  return (
    <article className="noir-tile" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
      <img src={product.imageUrl} alt={product.name} loading="lazy" />
      <div className="noir-tile-scrim" />

      {outOfStock && <span className="noir-badge out">Sold out</span>}
      {!outOfStock && lowStock && <span className="noir-badge low">{stock} left</span>}

      <button
        type="button"
        className={`noir-wish ${isWished ? 'active' : ''}`}
        onClick={(event) => { event.stopPropagation(); onToggleWish(); }}
        aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      >
        <StoreIcon name="heart" size={16} />
      </button>

      <div className="noir-tile-info">
        <p className="noir-tile-cat">{product.category || categoryLabel}</p>
        <div className="noir-tile-row">
          <h3>{product.name}</h3>
          <span>{formatCurrency(product.price)}</span>
        </div>
        <button
          type="button"
          className="noir-tile-add"
          onClick={(event) => { event.stopPropagation(); onAddToCart(); }}
          disabled={outOfStock}
        >
          <StoreIcon name="bag" size={14} />
          {outOfStock ? 'Sold out' : addLabel}
        </button>
      </div>
    </article>
  );
}
