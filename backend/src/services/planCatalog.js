export const subscriptionPlans = [
  {
    id: 'starter',
    name: 'Starter',
    amountNaira: 10000,
    interval: 'monthly',
    description: 'Store online with the basics you need to start selling.',
  },
  {
    id: 'growth',
    name: 'Growth',
    amountNaira: 25000,
    interval: 'monthly',
    description: 'Store plus delivery and growth tools for active sellers.',
  },
  {
    id: 'pro',
    name: 'Pro',
    amountNaira: 50000,
    interval: 'monthly',
    description: 'Priority support and the full commerce toolkit.',
  },
];

export function getSubscriptionPlan(planId) {
  return subscriptionPlans.find((plan) => plan.id === planId) || null;
}
