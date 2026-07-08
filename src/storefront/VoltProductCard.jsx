import { StoreIcon } from './icons';
import { isProductAvailable } from './storefrontUtils';

export default function VoltProductCard({ product, categoryLabel, isWished, addLabel, formatCurrency, onSelect, onAddToCart, onToggleWish }) {
  const stock = Number(product.stock || 0);
  const outOfStock = !isProductAvailable(product);
  const lowStock = stock > 0 && stock <= 5;

  return (
    <article className="volt-card">
      <div className="volt-card-media" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {outOfStock && <span className="volt-tag out">SOLD OUT</span>}
        {!outOfStock && lowStock && <span className="volt-tag low">{stock} LEFT</span>}
        <button
          type="button"
          className={`volt-wish ${isWished ? 'active' : ''}`}
          onClick={(event) => { event.stopPropagation(); onToggleWish(); }}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <StoreIcon name="heart" size={16} />
        </button>
      </div>
      <div className="volt-card-body">
        <p className="volt-card-cat">{product.category || categoryLabel}</p>
        <h3 className="volt-card-name" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>{product.name}</h3>
        <div className="volt-card-row">
          <span className="volt-card-price">{formatCurrency(product.price)}</span>
          <button type="button" className="volt-card-add" onClick={onAddToCart} disabled={outOfStock} aria-label={outOfStock ? 'Sold out' : `${addLabel} ${product.name}`}>
            <StoreIcon name="bag" size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
