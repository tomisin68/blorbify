import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { sendDigitalDeliveryEmail } from './notification.service.js';

// Never trusts a file URL from the order itself — the seller's private
// `stores/{sellerId}` doc (read via the admin SDK, bypassing rules) is the
// only source of truth for what a digital product's file actually is.
export async function resolveDigitalDeliveryItems({ order }) {
  if (!order) return [];

  if (order.digitalDelivery?.items?.length) {
    return order.digitalDelivery.items;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const digitalItems = items.filter((item) => item.type === 'digital');
  if (!digitalItems.length) return [];

  const sellerId = order.storeId;
  if (!sellerId) return [];

  const storeSnap = await adminDb.collection('stores').doc(sellerId).get();
  if (!storeSnap.exists) return [];

  const products = Array.isArray(storeSnap.data()?.products) ? storeSnap.data().products : [];

  return digitalItems
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      const fileUrl = product?.digitalFile?.url;
      if (!fileUrl) return null;
      return { productId: item.productId, name: product.name || item.name, fileUrl };
    })
    .filter(Boolean);
}

// Idempotent: if the order already has `digitalDelivery`, skips re-sending
// the email but still returns the stored links.
export async function deliverDigitalItems({ orderId }) {
  if (!orderId) return { delivered: false, items: [] };

  const orderRef = adminDb.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) return { delivered: false, items: [] };

  const order = orderSnap.data();

  if (order.digitalDelivery?.items?.length) {
    return { delivered: true, items: order.digitalDelivery.items, alreadyDelivered: true };
  }

  const items = await resolveDigitalDeliveryItems({ order });
  if (!items.length) return { delivered: false, items: [] };

  try {
    await sendDigitalDeliveryEmail({
      toEmail: order.customerEmail,
      toName: order.customerName,
      storeName: order.storeName,
      items,
    });
  } catch (error) {
    console.error('Digital delivery email failed:', error.message);
  }

  await orderRef.set(
    {
      digitalDelivery: {
        deliveredAt: fieldValue.serverTimestamp(),
        items,
      },
    },
    { merge: true }
  );

  return { delivered: true, items };
}
