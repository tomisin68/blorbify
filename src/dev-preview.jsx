import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Dashboard from './Dashboard';

const mockOnboardingData = {
  businessName: 'Marlow & Rye',
  businessType: 'clothing-boutique',
  storeSlug: 'marlow-and-rye',
  template: 'signature',
  primaryColor: '#AFFF00',
  products: [],
};

const params = new URLSearchParams(window.location.search);
const withSubscription = params.get('sub') === 'active';

const mockUser = {
  uid: 'preview-user',
  email: 'merchant@example.com',
  getIdToken: async () => 'fake-token-for-preview',
};

const mockUserProfile = {
  onboardingCompleted: true,
  onboardingData: mockOnboardingData,
  businessName: mockOnboardingData.businessName,
  storeSlug: mockOnboardingData.storeSlug,
  firstName: 'Chioma',
  lastName: 'Adewale',
  ...(withSubscription
    ? {
        subscription: {
          planId: 'growth',
          planName: 'Growth',
          status: 'active',
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }
    : {}),
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Dashboard user={mockUser} userProfile={mockUserProfile} onLogout={() => {}} />
  </StrictMode>
);
