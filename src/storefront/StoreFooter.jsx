import { SocialIcon } from './icons';
import { getPublicStoreBaseUrl } from '../storeLinks';

export default function StoreFooter({ store, footerText, visibleSocialLinks, businessTypeLabel }) {
  const year = new Date().getFullYear();
  const blorbifyHref = getPublicStoreBaseUrl();

  return (
    <footer className="store-footer">
      <div className="store-wrap store-footer-grid">
        <div className="store-footer-brand">
          <div className="store-footer-mark">
            {store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.businessName.charAt(0)}
          </div>
          <strong>{store.businessName}</strong>
          <p>{footerText}</p>
          {visibleSocialLinks.length > 0 && (
            <div className="store-footer-socials">
              {visibleSocialLinks.map((link) => (
                <a
                  key={link.type}
                  href={link.href}
                  target={link.type === 'email' ? undefined : '_blank'}
                  rel={link.type === 'email' ? undefined : 'noreferrer'}
                  aria-label={link.type}
                >
                  <SocialIcon type={link.type} size={16} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="store-footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="#shop">All products</a></li>
            <li><a href="#top">Back to top</a></li>
            {store.phone && <li><a href={`tel:${store.phone}`}>Call the store</a></li>}
          </ul>
        </div>

        <div className="store-footer-col">
          <h4>About</h4>
          <ul>
            <li>{businessTypeLabel}</li>
            {(store.city || store.state) && <li>{[store.city, store.state].filter(Boolean).join(', ')}</li>}
          </ul>
        </div>
      </div>

      <div className="store-wrap store-footer-bottom">
        <span>© {year} {store.businessName}. All rights reserved.</span>
        <a className="store-footer-made" href={blorbifyHref} target="_blank" rel="noreferrer">
          Built with 💛 by <strong>Blorbify</strong> — want a store like this? Create yours free
        </a>
      </div>
    </footer>
  );
}
