import { StoreIcon } from './icons';
import { isProductAvailable } from './storefrontUtils';

export default function KitchenProductCard({ product, categoryLabel, isWished, addLabel, formatCurrency, onSelect, onAddToCart, onToggleWish }) {
  const stock = Number(product.stock || 0);
  const outOfStock = !isProductAvailable(product);
  const lowStock = stock > 0 && stock <= 5;

  return (
    <article className={`kitchen-row ${outOfStock ? 'out' : ''}`}>
      <div className="kitchen-row-media" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {outOfStock && <span className="kitchen-badge out">Sold out</span>}
        {!outOfStock && lowStock && <span className="kitchen-badge low">{stock} left</span>}
      </div>
      <div className="kitchen-row-body">
        <div className="kitchen-row-top" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onSelect()}>
          <div className="kitchen-row-heading">
            <p className="kitchen-row-cat">{product.category || categoryLabel}</p>
            <h3>{product.name}</h3>
          </div>
          <span className="kitchen-row-price">{formatCurrency(product.price)}</span>
        </div>
        {product.description && <p className="kitchen-row-desc">{product.description}</p>}
        <div className="kitchen-row-actions">
          <button
            type="button"
            className={`kitchen-wish ${isWished ? 'active' : ''}`}
            onClick={() => onToggleWish()}
            aria-label={isWished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          >
            <StoreIcon name="heart" size={14} />
          </button>
          <button type="button" className="kitchen-row-add" onClick={() => onAddToCart()} disabled={outOfStock}>
            <StoreIcon name="bag" size={14} />
            {outOfStock ? 'Sold out' : addLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
