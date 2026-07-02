import React, { useState } from 'react';

export default function Step1_BusinessInfo({ formData, updateFormData, onNext }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const businessTypes = [
    { value: 'fashion', label: '👗 Fashion & Clothing' },
    { value: 'beauty', label: '💄 Beauty & Cosmetics' },
    { value: 'food', label: '🍔 Food & Beverages' },
    { value: 'electronics', label: '📱 Electronics & Gadgets' },
    { value: 'services', label: '💼 Services' },
    { value: 'handmade', label: '🎨 Handmade & Crafts' },
    { value: 'health', label: '💊 Health & Wellness' },
    { value: 'others', label: '📦 Others' },
  ];

  const states = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
    'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun',
    'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara'
  ];

  const validateField = (name, value) => {
    switch (name) {
      case 'businessName':
        if (!value.trim()) return 'Business name is required';
        if (value.trim().length < 2) return 'Business name must be at least 2 characters';
        return '';
      case 'businessType':
        if (!value) return 'Please select your business type';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        if (!/^[0-9]{10,11}$/.test(value.replace(/\D/g, ''))) 
          return 'Please enter a valid phone number (e.g., 08012345678)';
        return '';
      case 'city':
        if (!value.trim()) return 'City is required';
        return '';
      case 'state':
        if (!value) return 'Please select your state';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    
    // Validate on change
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const fields = ['businessName', 'businessType', 'phone', 'city', 'state'];
    const newErrors = {};
    let hasError = false;

    fields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    if (!hasError) {
      onNext();
    }
  };

  return (
    <div className="step-card">
      <style>{`
        .step-card {
          animation: fadeSlide 0.4s ease;
        }

        .form-group {
          margin-bottom: 22px;
        }

        .form-label {
          display: block;
          color: var(--ink);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .form-label .required {
          color: #FF6B6B;
          margin-left: 4px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid var(--paper-dim);
          border-radius: 12px;
          font-size: 15px;
          font-family: 'Raleway', sans-serif;
          color: var(--ink);
          transition: all 0.25s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--signal);
          box-shadow: 0 0 0 4px rgba(175, 255, 0, 0.1);
        }

        .form-input.error {
          border-color: #FF6B6B;
        }

        .form-input.error:focus {
          box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
        }

        .form-input::placeholder {
          color: var(--slate-dark);
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%235C6B6E'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 44px;
          cursor: pointer;
        }

        .form-select option {
          padding: 8px;
        }

        .form-error {
          color: #FF6B6B;
          font-size: 13px;
          font-weight: 500;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .form-error::before {
          content: '⚠️';
          font-size: 12px;
        }

        .form-hint {
          color: var(--slate-dark);
          font-size: 13px;
          margin-top: 4px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .btn-next {
          background: var(--signal);
          color: var(--ink);
          border: none;
          padding: 16px 36px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Raleway', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }

        .btn-next:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(175, 255, 0, 0.3);
        }

        .btn-next:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="step-title">🏢 Tell us about your business</div>
      <p className="step-description">
        We'll use this information to set up your store and make it visible to customers near you.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            Business Name <span className="required">*</span>
          </label>
          <input
            type="text"
            name="businessName"
            className={`form-input ${touched.businessName && errors.businessName ? 'error' : ''}`}
            placeholder="e.g., Chioma's Fashion Hub"
            value={formData.businessName}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength="50"
          />
          {touched.businessName && errors.businessName && (
            <div className="form-error">{errors.businessName}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Business Type <span className="required">*</span>
          </label>
          <select
            name="businessType"
            className={`form-input form-select ${touched.businessType && errors.businessType ? 'error' : ''}`}
            value={formData.businessType}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="">Select your business type</option>
            {businessTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {touched.businessType && errors.businessType && (
            <div className="form-error">{errors.businessType}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Business Description</label>
          <textarea
            name="description"
            className="form-input"
            placeholder="What do you sell? What makes your business special?"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            maxLength="200"
          />
          <div className="form-hint">
            {formData.description.length}/200 characters
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Phone Number <span className="required">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            className={`form-input ${touched.phone && errors.phone ? 'error' : ''}`}
            placeholder="08012345678"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.phone && errors.phone && (
            <div className="form-error">{errors.phone}</div>
          )}
          <div className="form-hint">Used for delivery communication with your customers</div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              City <span className="required">*</span>
            </label>
            <input
              type="text"
              name="city"
              className={`form-input ${touched.city && errors.city ? 'error' : ''}`}
              placeholder="e.g., Lagos, Ibadan"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.city && errors.city && (
              <div className="form-error">{errors.city}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              State <span className="required">*</span>
            </label>
            <select
              name="state"
              className={`form-input form-select ${touched.state && errors.state ? 'error' : ''}`}
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="">Select your state</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {touched.state && errors.state && (
              <div className="form-error">{errors.state}</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Social Links (Optional)</label>
          <input
            type="text"
            name="instagram"
            className="form-input"
            placeholder="Instagram username (e.g., @yourbrand)"
            value={formData.instagram}
            onChange={handleChange}
          />
          <div className="form-hint" style={{ marginTop: 8 }}>
            This helps customers connect with you on social media
          </div>
        </div>

        <button type="submit" className="btn-next">
          Next Step →
        </button>
      </form>
    </div>
  );
}