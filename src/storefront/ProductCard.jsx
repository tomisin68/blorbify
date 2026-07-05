import { StoreIcon } from './icons';

export default function ProductCard({ product, categoryLabel, isWished, addLabel, formatCurrency, onSelect, onAddToCart, onToggleWish }) {
  const stock = Number(product.stock || 0);
  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;

  return (
    <article className="pcard">
      <div className="pcard-media" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {outOfStock && <span className="pcard-badge out">Sold out</span>}
        {!outOfStock && lowStock && <span className="pcard-badge low">Only {stock} left</span>}
        <button
          type="button"
          className={`pcard-wish ${isWished ? 'active' : ''}`}
          onClick={(event) => { event.stopPropagation(); onToggleWish(); }}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <StoreIcon name="heart" size={16} />
        </button>
        <button
          type="button"
          className="pcard-add"
          onClick={(event) => { event.stopPropagation(); onAddToCart(); }}
          disabled={outOfStock}
        >
          <StoreIcon name="bag" size={14} />
          {outOfStock ? 'Sold out' : addLabel}
        </button>
      </div>
      <div className="pcard-body" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
        <p className="pcard-cat">{product.category || categoryLabel}</p>
        <h3 className="pcard-name">{product.name}</h3>
        <div className="pcard-price">{formatCurrency(product.price)}</div>
      </div>
    </article>
  );
}
