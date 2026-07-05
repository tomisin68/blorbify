import { env } from '../config/env.js';

// Table-based layout with inline styles only — the set that survives
// Outlook/Gmail's HTML sanitizing, unlike flexbox/grid or a <style> block.
export function renderEmailLayout({ preheader = '', heading, bodyHtml, ctaLabel, ctaUrl, footerNote }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading || 'Blorbify'}</title>
  </head>
  <body style="margin:0; padding:0; background:#0f1518;">
    ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1518; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#192328; border-radius:18px; border:1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding:26px 28px 0;">
                <span style="font-family:Arial,Helvetica,sans-serif; font-size:19px; font-weight:800; letter-spacing:-0.02em; color:#f6f8f1;">Blorbify</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 8px;">
                ${heading ? `<h1 style="margin:0 0 14px; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:1.3; color:#f6f8f1;">${heading}</h1>` : ''}
                <div style="font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.65; color:#c7d1d4;">
                  ${bodyHtml}
                </div>
              </td>
            </tr>
            ${ctaUrl ? `
            <tr>
              <td style="padding:6px 28px 26px;">
                <a href="${ctaUrl}" style="display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:800; color:#0f1518; background:#afff00; padding:12px 22px; border-radius:999px; text-decoration:none;">${ctaLabel || 'Open Blorbify'}</a>
              </td>
            </tr>` : '<tr><td style="padding-bottom:10px;"></td></tr>'}
            <tr>
              <td style="padding:16px 28px 24px; border-top:1px solid rgba(255,255,255,0.08);">
                <span style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#7c8a8e;">${footerNote || 'You are receiving this email because of account or order activity on Blorbify.'}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// A highlighted pill for short reference values (order refs, plan names) —
// matches the accent styling already used on the Paystack callback page.
export function renderEmailCodePill(value) {
  return `<span style="display:inline-block; margin-top:2px; padding:4px 10px; border-radius:8px; background:rgba(175,255,0,0.15); color:#afff00; font-family:ui-monospace,Consolas,monospace; font-size:13px;">${value}</span>`;
}

// A larger, centered variant of the code pill for one-time passcodes, where
// the code needs to be the visual focal point of the email.
export function renderEmailCodeBlock(value) {
  return `<div style="text-align:center; margin:6px 0 4px;"><span style="display:inline-block; padding:14px 26px; border-radius:12px; background:rgba(175,255,0,0.15); color:#afff00; font-family:ui-monospace,Consolas,monospace; font-size:32px; font-weight:700; letter-spacing:8px;">${value}</span></div>`;
}

export function getDashboardUrl(path = '/dashboard') {
  return `${env.appBaseUrl.replace(/\/+$/g, '')}${path}`;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}
