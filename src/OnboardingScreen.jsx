import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import BusinessInfo from './BusinessInfo';
import TemplateSelect from './TemplateSelect';
import AddProducts from './AddProducts';
import LaunchStore from './LaunchStore';

export default function OnboardingScreen({ userId, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'fashion',
    businessGoal: 'sell-online',
    template: 'minimal',
    products: [{ name: '', price: '', description: '' }],
    storeSlug: '',
  });

  const updateFormData = (changes) => {
    setFormData((prev) => ({ ...prev, ...changes }));
  };

  const saveDraft = async (data = formData) => {
    if (!userId) return;
    await setDoc(
      doc(db, 'users', userId),
      {
        onboardingDraft: data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const goNext = async () => {
    await saveDraft(formData);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const goBack = async () => {
    await saveDraft(formData);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!userId) {
      onComplete?.();
      return;
    }

    setLoading(true);
    try {
      const slug = (formData.businessName || 'my-store')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'my-store';

      const finalData = {
        ...formData,
        storeSlug: slug,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'stores', userId), {
        ...finalData,
        userId,
        createdAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, 'users', userId), {
        onboardingCompleted: true,
        onboardingDraft: finalData,
        storeSlug: slug,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      onComplete?.();
    } catch (error) {
      console.error('Onboarding save failed:', error);
      onComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Business info', icon: '🏢' },
    { id: 2, title: 'Template', icon: '🎨' },
    { id: 3, title: 'Products', icon: '📦' },
    { id: 4, title: 'Launch', icon: '🚀' },
  ];

  return (
    <div className="onboarding-root">
      <style>{`
        .onboarding-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: radial-gradient(120% 100% at 15% 0%, #223038 0%, #192328 55%, #0F1518 100%); font-family: 'Raleway', sans-serif; }
        .onboarding-card { width: 100%; max-width: 680px; background: #F6F8F1; border-radius: 24px; padding: 28px; box-shadow: 0 30px 60px rgba(0,0,0,0.25); }
        .step-bar { display: flex; gap: 10px; margin-bottom: 20px; }
        .step-pill { flex: 1; padding: 10px 12px; border-radius: 999px; text-align: center; font-size: 13px; font-weight: 700; color: #5C6B6E; background: #EAEFE0; }
        .step-pill.active { background: #AFFF00; color: #192328; }
        .step-pill.done { background: #192328; color: #F6F8F1; }
        .skip-link { margin-top: 16px; text-align: center; color: #5C6B6E; }
        .skip-link button { background: none; border: none; color: #2563eb; cursor: pointer; padding: 0; font-weight: 700; }
      `}</style>

      <div className="onboarding-card">
        <div className="step-bar">
          {steps.map((step) => (
            <div key={step.id} className={`step-pill ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'done' : ''}`}>
              {step.icon} {step.title}
            </div>
          ))}
        </div>

        {currentStep === 1 && <BusinessInfo formData={formData} updateFormData={updateFormData} onNext={goNext} onBack={onSkip || onComplete} />}
        {currentStep === 2 && <TemplateSelect formData={formData} updateFormData={updateFormData} onNext={goNext} onBack={goBack} />}
        {currentStep === 3 && <AddProducts formData={formData} updateFormData={updateFormData} onNext={goNext} onBack={goBack} />}
        {currentStep === 4 && <LaunchStore formData={formData} onBack={goBack} onComplete={handleComplete} loading={loading} />}

        <div className="skip-link">
          <button type="button" onClick={() => onSkip?.()}>Skip onboarding</button>
        </div>
      </div>
    </div>
  );
}
