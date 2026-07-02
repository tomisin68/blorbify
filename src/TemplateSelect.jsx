import React, { useState } from 'react';

export default function Step2_TemplateSelect({ formData, updateFormData, onNext, onPrev }) {
  const [selectedTemplate, setSelectedTemplate] = useState(formData.template || 'modern');
  const [primaryColor, setPrimaryColor] = useState(formData.primaryColor || '#AFFF00');
  
  const templates = [
    {
      id: 'modern',
      name: 'Modern',
      description: 'Clean, minimalist design perfect for any business',
      preview: 'https://loremflickr.com/400/300/modern,website,design?lock=1',
      colors: ['#AFFF00', '#192328', '#FFFFFF', '#F6F8F1'],
    },
    {
      id: 'elegant',
      name: 'Elegant',
      description: 'Sophisticated look for fashion, beauty, and luxury',
      preview: 'https://loremflickr.com/400/300/elegant,store,design?lock=2',
      colors: ['#D4AF37', '#1A1A1A', '#FFFFFF', '#F5F0E8'],
    },
    {
      id: 'bold',
      name: 'Bold',
      description: 'Vibrant and eye-catching for energetic brands',
      preview: 'https://loremflickr.com/400/300/vibrant,store,design?lock=3',
      colors: ['#FF6B35', '#0F1518', '#FFFFFF', '#FFF4F0'],
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple, clean, and focused on your products',
      preview: 'https://loremflickr.com/400/300/minimal,store,design?lock=4',
      colors: ['#2C3E50', '#ECF0F1', '#FFFFFF', '#BDC3C7'],
    },
  ];

  const colorPresets = [
    '#AFFF00', '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#FFA07A', '#98D8C8', '#DDA0DD', '#F0E68C',
  ];

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    updateFormData({ template: templateId });
  };

  const handleColorChange = (color) => {
    setPrimaryColor(color);
    updateFormData({ primaryColor: color });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateFormData({ 
      template: selectedTemplate,
      primaryColor: primaryColor 
    });
    onNext();
  };

  return (
    <div className="step-card">
      <style>{`
        .template-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin: 20px 0 24px;
        }

        .template-card {
          border: 2px solid var(--paper-dim);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .template-card.selected {
          border-color: var(--signal);
          box-shadow: 0 0 0 4px rgba(175, 255, 0, 0.15);
        }

        .template-card img {
          width: 100%;
          height: 140px;
          object-fit: cover;
        }

        .template-info {
          padding: 14px 16px;
        }

        .template-info h4 {
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }

        .template-info p {
          font-size: 13px;
          color: var(--slate-dark);
          line-height: 1.4;
        }

        .color-picker-section {
          margin: 20px 0 24px;
        }

        .color-picker-section label {
          display: block;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 12px;
          font-size: 14px;
        }

        .color-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .color-option {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.selected {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px white, 0 0 0 5px var(--ink);
        }

        .color-option .check {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 16px;
          font-weight: bold;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .btn-group {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-back {
          background: transparent;
          border: 2px solid var(--paper-dim);
          color: var(--slate-dark);
          padding: 16px 28px;
          border-radius: 100px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Raleway', sans-serif;
        }

        .btn-back:hover {
          border-color: var(--ink);
          color: var(--ink);
        }

        @media (max-width: 640px) {
          .template-grid {
            grid-template-columns: 1fr;
          }

          .template-card img {
            height: 120px;
          }
        }
      `}</style>

      <div className="step-title">🎨 Choose your store design</div>
      <p className="step-description">
        Pick a template that matches your brand. You can customize colors and change it later.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="template-grid">
          {templates.map(template => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <img src={template.preview} alt={template.name} />
              <div className="template-info">
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: 8 }}>
                  {template.colors.map((color, i) => (
                    <span 
                      key={i}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: color,
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'inline-block',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="color-picker-section">
          <label>Pick your primary color</label>
          <div className="color-grid">
            {colorPresets.map(color => (
              <div
                key={color}
                className={`color-option ${primaryColor === color ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() => handleColorChange(color)}
              >
                {primaryColor === color && (
                  <span className="check">✓</span>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => handleColorChange(e.target.value)}
                style={{
                  width: 44,
                  height: 44,
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--slate-dark)' }}>Custom</span>
            </div>
          </div>
        </div>

        <div className="btn-group">
          <button type="button" className="btn-back" onClick={onPrev}>
            Back
          </button>
          <button type="submit" className="btn-next" style={{ flex: 1, justifyContent: 'center' }}>
            Next Step →
          </button>
        </div>
      </form>
    </div>
  );
}