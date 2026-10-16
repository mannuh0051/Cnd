export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, amount, reference, description } = req.body || {};
  if (!phone || !amount || !reference) {
    return res.status(400).json({ error: 'phone, amount and reference are required' });
  }

  const payload = {
    phone,
    amount,
    reference,
    channelId: process.env.REACT_APP_PAYLOR_CHANNEL_ID,
    description: description || 'Payment',
    callbackUrl: `${req.headers.origin || ''}/api/paylor-callback`
  };

  try {
    const response = await fetch('https://api.paylorke.com/api/v1/merchants/payments/stk-push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_PAYLOR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[stk-push]', { reference, response: data });

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || 'STK push failed',
        details: data
      });
    }

    return res.status(200).json({
      transactionId: data.transactionId || data.id,
      status: data.status || 'SENT',
      reference
    });
  } catch (err) {
    console.error('[stk-push error]', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
