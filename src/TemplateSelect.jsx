import { useState } from 'react';
import { IconPalette, IconArrowLeft, IconArrowRight } from './onboardingIcons';
import { colorPresets, getReadableTextColor, storeTemplates } from './storeTemplates';

export default function Step2_TemplateSelect({ formData, updateFormData, onNext, onPrev }) {
  const [selectedTemplate, setSelectedTemplate] = useState(formData.template || 'signature');
  const [primaryColor, setPrimaryColor] = useState(formData.primaryColor || '#AFFF00');

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
      primaryColor: primaryColor,
    });
    onNext();
  };

  return (
    <div className="step-card">
      <style>{`
        .template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 18px 0 22px; }
        .template-card { border: 2px solid transparent; border-radius: 20px; overflow: hidden; cursor: pointer; transition: all 0.25s ease; background: #fff; box-shadow: 0 10px 24px rgba(0,0,0,0.05); }
        .template-card:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(0,0,0,0.09); }
        .template-card.selected { border-color: var(--tc-accent, #AFFF00); box-shadow: 0 0 0 4px color-mix(in srgb, var(--tc-accent, #AFFF00) 22%, transparent); }
        .template-preview { height: 150px; padding: 16px; display: grid; align-content: end; gap: 8px; background: var(--tc-surface); }
        .template-preview .swatch { width: 40px; height: 40px; border-radius: 10px; background: var(--tc-accent); }
        .template-preview .line-lg { width: 82%; height: 13px; border-radius: 999px; background: var(--tc-ink); }
        .template-preview .line-sm { width: 55%; height: 9px; border-radius: 999px; background: color-mix(in srgb, var(--tc-ink) 30%, transparent); }
        .preview-noir { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr auto auto; align-content: stretch; gap: 8px; }
        .preview-noir .swatch { grid-row: 1 / 4; width: auto; height: auto; border-radius: 4px; background: linear-gradient(150deg, color-mix(in srgb, var(--tc-accent) 30%, var(--tc-ink)), var(--tc-ink)); }
        .preview-noir .line-lg { align-self: end; border-radius: 4px; text-transform: uppercase; }
        .preview-noir .line-sm { border-radius: 4px; background: var(--tc-accent); height: 7px; width: 40%; }
        .template-info { padding: 13px 15px; }
        .template-info h4 { font-size: 15px; font-weight: 800; color: #192328; margin: 0 0 4px; }
        .template-info p { font-size: 12.5px; color: #5C6B6E; line-height: 1.45; margin: 0; }
        .color-picker-section { margin: 16px 0 18px; }
        .color-picker-section label { display: block; font-weight: 700; color: #192328; margin-bottom: 10px; font-size: 14px; }
        .color-grid { display: flex; gap: 10px; flex-wrap: wrap; }
        .color-option { width: 40px; height: 40px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: all 0.2s ease; position: relative; }
        .color-option:hover { transform: scale(1.08); }
        .color-option.selected { border-color: #192328; box-shadow: 0 0 0 3px white, 0 0 0 5px #192328; }
        .color-option .check { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 15px; font-weight: 900; text-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .btn-group { display: flex; gap: 12px; margin-top: 8px; }
        .btn-back { background: transparent; border: 1px solid rgba(25,35,40,0.12); color: #5C6B6E; padding: 12px 20px; border-radius: 999px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.25s ease; font-family: 'Raleway', sans-serif; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-back:hover { border-color: #192328; color: #192328; }
        .btn-next { min-width: 160px; }
        @media (max-width: 640px) { .template-grid { grid-template-columns: 1fr; } .btn-group { flex-direction: column-reverse; } .btn-back, .btn-next { width: 100%; justify-content: center; } }
      `}</style>

      <div className="step-title"><IconPalette size={20} style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} /> Choose your store design</div>
      <p className="step-description">
        Pick a design that matches your brand. You can fine-tune colors, copy, and media later from your dashboard.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="template-grid">
          {storeTemplates.map((template) => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              style={{ '--tc-accent': template.accent, '--tc-ink': template.ink, '--tc-surface': template.surface }}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className={`template-preview preview-${template.id}`}>
                <div className="swatch" />
                <div className="line-lg" />
                <div className="line-sm" />
              </div>
              <div className="template-info">
                <h4>{template.name}</h4>
                <p>{template.description}</p>
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
                  <span className="check" style={{ color: getReadableTextColor(color) }}>✓</span>
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
            <IconArrowLeft size={16} />
            Back
          </button>
          <button type="submit" className="btn-next" style={{ flex: 1, justifyContent: 'center' }}>
            Continue
            <IconArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
