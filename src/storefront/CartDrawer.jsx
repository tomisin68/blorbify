import { StoreIcon } from './icons';

export default function CartDrawer({
  open,
  onClose,
  cart,
  cartCount,
  cartSubtotal,
  deliveryFee,
  cartTotal,
  freeShippingThreshold,
  updateQuantity,
  removeItem,
  customer,
  onCustomerChange,
  onSubmit,
  submitting,
  orderPlaced,
  onContinueShopping,
  checkoutLabel,
  formatCurrency,
}) {
  const remainingForFreeDelivery = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, freeShippingThreshold ? (cartSubtotal / freeShippingThreshold) * 100 : 0);
  const freeDeliveryUnlocked = cartSubtotal >= freeShippingThreshold;

  return (
    <div className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="cart-drawer-overlay" onClick={onClose} />
      <aside className="cart-drawer-panel" aria-label="Shopping cart">
        <div className="cart-drawer-head">
          <h3><StoreIcon name="bag" size={18} /> Your cart{cartCount > 0 ? ` (${cartCount})` : ''}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close cart"><StoreIcon name="close" size={18} /></button>
        </div>

        {orderPlaced ? (
          <div className="cart-success">
            <span className="cart-success-badge"><StoreIcon name="sparkles" size={26} /></span>
            <h4>Order placed!</h4>
            <p>Thank you — the seller has your order and will reach out shortly to confirm delivery.</p>
            <button type="button" className="store-cta" onClick={onContinueShopping}>Keep shopping</button>
          </div>
        ) : (
          <div className="cart-drawer-body">
            {cart.length ? (
              <div className="cart-drawer-items">
                {cart.map((item) => (
                  <div className="cart-row" key={item.id}>
                    <div className="cart-row-img"><img src={item.imageUrl} alt="" /></div>
                    <div className="cart-row-info">
                      <p className="cart-row-name">{item.name}</p>
                      <p className="cart-row-price">{formatCurrency(item.price)}</p>
                      <div className="cart-row-controls">
                        <div className="qty-stepper">
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Reduce ${item.name}`}><StoreIcon name="minus" size={13} /></button>
                          <b>{item.quantity}</b>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}><StoreIcon name="plus" size={13} /></button>
                        </div>
                        <span className="cart-row-total">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button type="button" className="cart-row-remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                      <StoreIcon name="close" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cart-drawer-empty">
                <StoreIcon name="bag" size={32} />
                <p>Your cart is empty — go find something you love.</p>
              </div>
            )}

            <div className="cart-drawer-foot">
              {cart.length > 0 && (
                <div className="ship-progress">
                  <div className="ship-progress-msg">
                    <StoreIcon name="truck" size={14} />
                    {freeDeliveryUnlocked
                      ? <span><strong>Free delivery unlocked!</strong></span>
                      : <span>Add <strong>{formatCurrency(remainingForFreeDelivery)}</strong> more for free delivery</span>}
                  </div>
                  <div className="ship-progress-track"><div className="ship-progress-fill" style={{ width: `${freeDeliveryProgress}%` }} /></div>
                </div>
              )}

              <div className="cart-totals">
                <div className="cart-total-row"><span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span></div>
                <div className="cart-total-row"><span>Delivery</span><span>{cart.length ? formatCurrency(freeDeliveryUnlocked ? 0 : deliveryFee) : formatCurrency(0)}</span></div>
                <div className="cart-total-row grand"><span>Total</span><span>{formatCurrency(freeDeliveryUnlocked ? cartSubtotal : cartTotal)}</span></div>
              </div>

              <form className="cart-checkout-form" onSubmit={onSubmit}>
                <input value={customer.name} onChange={(event) => onCustomerChange('name', event.target.value)} placeholder="Your name" />
                <input value={customer.phone} onChange={(event) => onCustomerChange('phone', event.target.value)} placeholder="Phone number" />
                <textarea value={customer.address} onChange={(event) => onCustomerChange('address', event.target.value)} placeholder="Delivery address" />
                <textarea value={customer.note} onChange={(event) => onCustomerChange('note', event.target.value)} placeholder="Note for the seller (optional)" />
                <button type="submit" className="store-cta block" disabled={submitting || !cart.length}>
                  {submitting ? 'Placing order...' : checkoutLabel}
                </button>
              </form>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
