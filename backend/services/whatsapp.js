const fetch = require('node-fetch');

function digitsOnly(phone) {
  return String(phone || '').replace(/[^\d]/g, '');
}

/**
 * Send a WhatsApp message to admin.
 * - If WhatsApp Cloud API env vars are configured, attempts to send via Graph API.
 * - Otherwise returns a `waLink` fallback that can be opened manually.
 */
async function sendWhatsAppToAdmin({ adminPhone, message }) {
  const adminDigits = digitsOnly(adminPhone);
  const waLink = `https://wa.me/${adminDigits}?text=${encodeURIComponent(message)}`;

  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiBase = process.env.WHATSAPP_CLOUD_API_BASE_URL || 'https://graph.facebook.com/v19.0';

  if (!token || !phoneNumberId) {
    // Dev-friendly fallback
    console.warn('WhatsApp Cloud API not configured. Using waLink fallback.', {
      hasToken: Boolean(token),
      hasPhoneNumberId: Boolean(phoneNumberId),
      adminPhone: adminDigits,
    });
    return { sent: false, waLink };
  }

  try {
    const url = `${apiBase}/${phoneNumberId}/messages`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: adminDigits,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('WhatsApp send failed:', { status: resp.status, data });
      return { sent: false, waLink, error: data };
    }

    return { sent: true, waLink, graphResponse: data };
  } catch (err) {
    console.error('WhatsApp send error:', err);
    return { sent: false, waLink, error: String(err && err.message ? err.message : err) };
  }
}

module.exports = {
  sendWhatsAppToAdmin,
};

