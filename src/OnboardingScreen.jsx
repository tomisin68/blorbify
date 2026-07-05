import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import BusinessInfo from './BusinessInfo';
import TemplateSelect from './TemplateSelect';
import LaunchStore from './LaunchStore';
import { IconBriefcase, IconPalette, IconRocket, IconSparkles, IconCheck } from './onboardingIcons';
import { createStoreSlug, getStoreUrl } from './storeLinks';
import { buildPublicStorePayload } from './publicStore';

class OnboardingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Onboarding render failed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="onboarding-root">
          <div className="onboarding-card" style={{ maxWidth: 560 }}>
            <h2 style={{ marginTop: 0 }}>We hit a snag</h2>
            <p style={{ color: '#5C6B6E', lineHeight: 1.6 }}>
              The onboarding experience could not render correctly. Please refresh and try again.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const defaultFormData = {
  businessName: '',
  businessType: '',
  businessGoal: 'sell-online',
  description: '',
  phone: '',
  city: '',
  state: '',
  instagram: '',
  template: 'signature',
  primaryColor: '#AFFF00',
  storeSlug: '',
};

function getInitialFormData(profile) {
  const savedData = profile?.onboardingDraft || profile?.onboardingData || {};
  return {
    ...defaultFormData,
    ...savedData,
    businessName: savedData.businessName || profile?.businessName || defaultFormData.businessName,
    businessType: savedData.businessType || profile?.businessType || defaultFormData.businessType,
    phone: savedData.phone || profile?.phone || defaultFormData.phone,
    city: savedData.city || profile?.city || defaultFormData.city,
    state: savedData.state || profile?.state || defaultFormData.state,
    instagram: savedData.instagram || profile?.instagram || defaultFormData.instagram,
    template: savedData.template || profile?.template || defaultFormData.template,
    primaryColor: savedData.primaryColor || profile?.primaryColor || defaultFormData.primaryColor,
    storeSlug: savedData.storeSlug || profile?.storeSlug || defaultFormData.storeSlug,
  };
}

function sanitizeOnboardingData(data) {
  const sanitized = { ...defaultFormData, ...(data || {}) };
  delete sanitized.products;
  return sanitized;
}

export default function OnboardingScreen({ userId, userProfile, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [formData, setFormData] = useState(() => getInitialFormData(userProfile));

  const updateFormData = (changes) => {
    setFormData((prev) => ({ ...prev, ...changes }));
    setSaveError('');
  };

  const saveDraft = async (data = formData) => {
    if (!userId) return;
    const draft = sanitizeOnboardingData(data);
    await setDoc(
      doc(db, 'users', userId),
      {
        onboardingCompleted: false,
        onboardingDraft: draft,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const goNext = async () => {
    setLoading(true);
    setSaveError('');
    try {
      await saveDraft(formData);
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } catch (error) {
      console.error('Onboarding draft save failed:', error);
      setSaveError('We could not save this step to Firestore. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = async () => {
    try {
      await saveDraft(formData);
    } catch (error) {
      console.error('Onboarding draft save failed:', error);
    } finally {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleComplete = async () => {
    if (!userId) {
      onComplete?.();
      return;
    }

    setLoading(true);
    setSaveError('');
    try {
      const slug = createStoreSlug(formData.businessName);
      const storeUrl = getStoreUrl(slug);

      const finalData = {
        ...sanitizeOnboardingData(formData),
        storeSlug: slug,
        storeUrl,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'stores', userId), {
        ...finalData,
        userId,
        createdAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, 'publicStores', slug), {
        ...buildPublicStorePayload(finalData, userId),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, 'users', userId), {
        onboardingCompleted: true,
        onboardingDraft: finalData,
        onboardingData: finalData,
        businessName: formData.businessName || '',
        businessType: formData.businessType || '',
        phone: formData.phone || '',
        city: formData.city || '',
        state: formData.state || '',
        instagram: formData.instagram || '',
        template: formData.template || 'signature',
        primaryColor: formData.primaryColor || '#AFFF00',
        storeSlug: slug,
        storeUrl,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      onComplete?.(finalData);
    } catch (error) {
      console.error('Onboarding save failed:', error);
      setSaveError('Your onboarding information was not saved. Please try launching again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Business info', icon: <IconBriefcase size={16} /> },
    { id: 2, title: 'Template', icon: <IconPalette size={16} /> },
    { id: 3, title: 'Launch', icon: <IconRocket size={16} /> },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BusinessInfo formData={formData} updateFormData={updateFormData} onNext={goNext} />;
      case 2:
        return <TemplateSelect formData={formData} updateFormData={updateFormData} onNext={goNext} onPrev={goBack} />;
      case 3:
        return <LaunchStore formData={formData} onBack={goBack} onComplete={handleComplete} loading={loading} />;
      default:
        return <BusinessInfo formData={formData} updateFormData={updateFormData} onNext={goNext} />;
    }
  };

  return (
    <OnboardingErrorBoundary>
      <div className="onboarding-root">
        <style>{`
          .onboarding-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background:
              radial-gradient(120% 120% at 10% 0%, rgba(175,255,0,0.24) 0%, transparent 32%),
              linear-gradient(125deg, #182328 0%, #0f1518 50%, #11181c 100%);
            font-family: 'Raleway', sans-serif;
          }
          .onboarding-card {
            width: min(100%, 760px);
            background: rgba(246,248,241,0.97);
            border: 1px solid rgba(25,35,40,0.08);
            border-radius: 28px;
            padding: 24px;
            box-shadow: 0 32px 80px rgba(0,0,0,0.24);
            backdrop-filter: blur(16px);
          }
          .onboarding-hero {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
            padding: 12px 4px 20px;
            border-bottom: 1px solid rgba(25,35,40,0.08);
          }
          .onboarding-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(175,255,0,0.16);
            color: #192328;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .onboarding-title {
            font-size: clamp(24px, 3vw, 30px);
            margin: 8px 0 6px;
            color: #192328;
          }
          .onboarding-subtitle {
            margin: 0;
            color: #5C6B6E;
            line-height: 1.6;
            max-width: 560px;
          }
          .progress-track {
            height: 6px;
            border-radius: 999px;
            background: #EFF3E8;
            overflow: hidden;
            margin-bottom: 16px;
          }
          .progress-fill {
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #8FDD00, #AFFF00);
            transition: width 0.45s cubic-bezier(0.65, 0, 0.35, 1);
          }
          .step-bar {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 20px;
          }
          .step-pill {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            color: #5C6B6E;
            background: #EFF3E8;
            border: 1px solid transparent;
            transition: all 0.25s ease;
          }
          .step-pill.active {
            background: #AFFF00;
            color: #192328;
            box-shadow: 0 10px 24px rgba(175,255,0,0.18);
          }
          .step-pill.done {
            background: #192328;
            color: #F6F8F1;
          }
          .step-card {
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(255,255,255,0.88), rgba(246,248,241,0.95));
            border: 1px solid rgba(25,35,40,0.06);
            padding: 24px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
            animation: stepFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes stepFadeSlide {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .step-card { animation: none; }
            .progress-fill { transition: none; }
          }
          .save-error {
            margin: 0 0 14px;
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(255,107,107,0.1);
            border: 1px solid rgba(255,107,107,0.25);
            color: #A52828;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.45;
          }
          .step-title {
            font-size: clamp(20px, 2.4vw, 24px);
            font-weight: 800;
            color: #192328;
            margin: 0 0 8px;
          }
          .step-description {
            color: #5C6B6E;
            line-height: 1.6;
            margin: 0 0 18px;
          }
          .form-input, .form-select, .form-textarea {
            border: 1px solid rgba(25,35,40,0.12);
            background: #fff;
            border-radius: 14px;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
          }
          .btn-next, .btn-back {
            border-radius: 999px;
          }
          @media (max-width: 760px) {
            .onboarding-root { padding: 12px; }
            .onboarding-card { padding: 16px; border-radius: 20px; }
            .onboarding-hero { flex-direction: column; align-items: flex-start; }
            .step-bar { grid-template-columns: 1fr; }
            .step-card { padding: 18px; }
          }
        `}</style>

        <div className="onboarding-card">
          <div className="onboarding-hero">
            <div>
              <div className="onboarding-badge">
                <IconSparkles size={14} />
                Guided setup
              </div>
              <h2 className="onboarding-title">Create your store in minutes</h2>
              <p className="onboarding-subtitle">A beautifully guided setup that looks and feels as premium as the landing page.</p>
            </div>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
          </div>

          <div className="step-bar">
            {steps.map((step) => {
              const done = currentStep > step.id;
              return (
                <div key={step.id} className={`step-pill ${currentStep === step.id ? 'active' : ''} ${done ? 'done' : ''}`}>
                  {done ? <IconCheck size={14} /> : step.icon}
                  <span>{step.title}</span>
                </div>
              );
            })}
          </div>

          <div key={currentStep}>
            {renderStep()}
          </div>

          {saveError && <div className="save-error">{saveError}</div>}
        </div>
      </div>
    </OnboardingErrorBoundary>
  );
}
