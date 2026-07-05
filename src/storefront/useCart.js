import { useEffect, useMemo, useState } from 'react';

function cartStorageKey(slug) {
  return `blorbify:cart:${slug || 'store'}`;
}

function readStoredCart(slug) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(cartStorageKey(slug));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function productKey(product) {
  return product?.id || product?.imageUrl || product?.name;
}

export function useCart(slug, { onAdd, onRemove, onLimit } = {}) {
  const [cart, setCart] = useState(() => readStoredCart(slug));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(cartStorageKey(slug), JSON.stringify(cart));
    } catch {
      // Storage can fail in private-browsing contexts; the cart still works in-memory.
    }
  }, [cart, slug]);

  const addToCart = (product, quantity = 1) => {
    const id = productKey(product);
    if (!id) return;
    const stock = Number(product.stock || 0);
    let capped = false;

    setCart((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) {
        const nextQuantity = stock ? Math.min(existing.quantity + quantity, stock) : existing.quantity + quantity;
        capped = stock ? nextQuantity === existing.quantity && quantity > 0 : false;
        return current.map((item) => (item.id === id ? { ...item, quantity: nextQuantity } : item));
      }

      const nextQuantity = stock ? Math.min(quantity, stock) : quantity;
      return [
        ...current,
        {
          id,
          name: product.name,
          price: Number(product.price || 0),
          imageUrl: product.imageUrl,
          category: product.category || '',
          stock,
          quantity: nextQuantity,
        },
      ];
    });

    if (capped) onLimit?.(product);
    else onAdd?.(product, quantity);
  };

  const updateQuantity = (itemId, quantity) => {
    setCart((current) => current
      .map((item) => {
        if (item.id !== itemId) return item;
        const max = Number(item.stock || 0);
        const nextQuantity = Math.max(0, max ? Math.min(quantity, max) : quantity);
        return { ...item, quantity: nextQuantity };
      })
      .filter((item) => item.quantity > 0));
  };

  const removeItem = (itemId) => {
    setCart((current) => {
      const removed = current.find((item) => item.id === itemId);
      if (removed) onRemove?.(removed);
      return current.filter((item) => item.id !== itemId);
    });
  };

  const clearCart = () => setCart([]);

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((total, item) => total + Number(item.price || 0) * item.quantity, 0), [cart]);

  return { cart, cartCount, cartSubtotal, addToCart, updateQuantity, removeItem, clearCart };
}
