export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, transactionId, reference, amount, type, submittedAt } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

  const record = {
    type: type || 'paid_guide',
    name,
    email: email || null,
    phone,
    transactionId: transactionId || null,
    reference: reference || null,
    amount: amount != null ? Number(amount) : null,
    submittedAt: submittedAt || new Date().toISOString(),
    source: req.headers.referer || 'website'
  };

  console.log('[guide] new paid lead', record);

  const webhook = process.env.GUIDE_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (e) {
      console.warn('[guide] webhook failed', e.message);
    }
  }

  return res.status(200).json({ ok: true, message: 'Guide request received' });
}
