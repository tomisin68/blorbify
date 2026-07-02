import React, { useState } from 'react';

export default function Step3_AddProducts({ formData, updateFormData, onNext, onPrev }) {
  const [products, setProducts] = useState(formData.products || [
    { name: '', price: '', description: '', image: null }
  ]);

  const addProduct = () => {
    if (products.length < 10) {
      setProducts([...products, { name: '', price: '', description: '', image: null }]);
    }
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      const newProducts = products.filter((_, i) => i !== index);
      setProducts(newProducts);
      updateFormData({ products: newProducts });
    }
  };

  const updateProduct = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
    updateFormData({ products: newProducts });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out empty products
    const validProducts = products.filter(p => p.name.trim() || p.price);
    updateFormData({ products: validProducts.length > 0 ? validProducts : products });
    onNext();
  };

  return (
    <div className="step-card">
      <style>{`
        .product-list {
          margin: 16px 0;
        }

        .product-item {
          background: var(--paper);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;
          border: 1px solid var(--paper-dim);
        }

        .product-item .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: var(--slate-dark);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-item .remove-btn:hover {
          background: rgba(255,107,107,0.1);
          color: #FF6B6B;
        }

        .product-fields {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
        }

        .product-fields .full-width {
          grid-column: 1 / -1;
        }

        .add-product-btn {
          width: 100%;
          padding: 14px;
          border: 2px dashed var(--paper-dim);
          border-radius: 12px;
          background: transparent;
          color: var(--slate-dark);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Raleway', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 8px 0 16px;
        }

        .add-product-btn:hover {
          border-color: var(--signal);
          color: var(--ink);
          background: rgba(175, 255, 0, 0.05);
        }

        .product-count {
          color: var(--slate-dark);
          font-size: 13px;
          text-align: center;
          margin-bottom: 12px;
        }

        @media (max-width: 640px) {
          .product-fields {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="step-title">📦 Add your products</div>
      <p className="step-description">
        Start with your best-selling products. You can always add more later from your dashboard.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="product-list">
          {products.map((product, index) => (
            <div key={index} className="product-item">
              {products.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeProduct(index)}
                >
                  ×
                </button>
              )}
              <div className="product-fields">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Ankara Maxi Dress"
                    value={product.name}
                    onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Price (₦)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 8500"
                    value={product.price}
                    onChange={(e) => updateProduct(index, 'price', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label" style={{ fontSize: 12 }}>
                    Description
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief description of the product"
                    value={product.description}
                    onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length < 10 && (
          <button type="button" className="add-product-btn" onClick={addProduct}>
            + Add another product
          </button>
        )}

        <div className="product-count">
          {products.filter(p => p.name.trim()).length} products added (max 10 for now)
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