import { StoreIcon, SocialIcon } from './icons';
import { nigerianStates } from '../nigerianStates';

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
  digitalDelivery,
  onContinueShopping,
  checkoutLabel,
  formatCurrency,
  whatsappEnabled,
  onWhatsAppCheckout,
  couponCode,
  onCouponCodeChange,
}) {
  const remainingForFreeDelivery = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, freeShippingThreshold ? (cartSubtotal / freeShippingThreshold) * 100 : 0);
  const freeDeliveryUnlocked = cartSubtotal >= freeShippingThreshold;
  const requiresAddress = cart.some((item) => item.type !== 'digital');

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
            {digitalDelivery?.length > 0 && (
              <div className="cart-digital-delivery">
                <p>Your download{digitalDelivery.length > 1 ? 's are' : ' is'} ready — also emailed to you:</p>
                {digitalDelivery.map((item) => (
                  <a key={item.productId || item.fileUrl} href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="store-cta block">
                    <StoreIcon name="bag" size={14} /> Download {item.name}
                  </a>
                ))}
              </div>
            )}
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
                <div className="cart-total-row"><span>Delivery</span><span>{requiresAddress ? formatCurrency(freeDeliveryUnlocked ? 0 : deliveryFee) : formatCurrency(0)}</span></div>
                <div className="cart-total-row grand"><span>Total</span><span>{formatCurrency(freeDeliveryUnlocked ? cartSubtotal : cartTotal)}</span></div>
              </div>

              {typeof couponCode === 'string' && (
                <div className="cart-coupon-row">
                  <input
                    value={couponCode}
                    onChange={(event) => onCouponCodeChange(event.target.value.toUpperCase())}
                    placeholder="Coupon code (optional)"
                    className="cart-coupon-input"
                  />
                  <p className="cart-coupon-hint">Valid codes are applied when you continue to payment.</p>
                </div>
              )}

              <form className="cart-checkout-form" onSubmit={onSubmit}>
                <input value={customer.name} onChange={(event) => onCustomerChange('name', event.target.value)} placeholder="Your name" />
                <input type="email" value={customer.email} onChange={(event) => onCustomerChange('email', event.target.value)} placeholder="Email (for your payment receipt)" />
                <input value={customer.phone} onChange={(event) => onCustomerChange('phone', event.target.value)} placeholder="Phone number" />
                <input type="tel" value={customer.whatsapp} onChange={(event) => onCustomerChange('whatsapp', event.target.value)} placeholder="WhatsApp number (so the seller can reach you)" />
                <select value={customer.location} onChange={(event) => onCustomerChange('location', event.target.value)}>
                  <option value="">Select your state</option>
                  {nigerianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <textarea value={customer.address} onChange={(event) => onCustomerChange('address', event.target.value)} placeholder={requiresAddress ? 'Delivery address' : 'Delivery address (not needed for digital items)'} />
                <textarea value={customer.note} onChange={(event) => onCustomerChange('note', event.target.value)} placeholder="Note for the seller (optional)" />
                <button type="submit" className="store-cta block" disabled={submitting || !cart.length}>
                  {submitting ? 'Redirecting to payment...' : checkoutLabel}
                </button>
                {whatsappEnabled && (
                  <button
                    type="button"
                    className="store-cta block whatsapp-cta"
                    onClick={onWhatsAppCheckout}
                    disabled={!cart.length}
                  >
                    <SocialIcon type="whatsapp" size={16} /> Order via WhatsApp instead
                  </button>
                )}
              </form>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
