export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Use Vercel ENV, but fallback to your WORKING keys if Vercel fails
  const apiKey = process.env.REACT_APP_PAYLOR_API_KEY || "pk_-phQ7tCvHCXPmMbvk1xFxNAyLnbkmgFM";
  const channelId = process.env.REACT_APP_PAYLOR_CHANNEL_ID || "PAYL-3WZA62";

  // --- INITIATE STK PUSH ---
  if (req.method === 'POST') {
    const { phone, amount, reference, description } = req.body || {};
    console.log(`[PAYLOR PUSH] Attempting:`, { phone, amount, reference, channelId });

    if (!phone || !amount || !reference) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const response = await fetch('https://api.paylorke.com/api/v1/merchants/payments/stk-push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone,
          amount,
          reference,
          channelId,
          description: description || 'Payment'
        })
      });

      const data = await response.json();
      console.log(`[PAYLOR PUSH RESPONSE] Status ${response.status}:`, data);

      if (!response.ok) {
        return res.status(response.status).json({ 
          error: data.message || data.error || 'STK Failed', 
          paylor_details: data 
        });
      }

      return res.status(200).json({ transactionId: data.transactionId || data.id });
    } catch (err) {
      console.error(`[PAYLOR PUSH CATCH]`, err);
      return res.status(500).json({ error: err.message });
    }
  }

  // --- CHECK STATUS ---
  if (req.method === 'GET') {
    const { transactionId } = req.query;
    if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });

    try {
      const response = await fetch(`https://api.paylorke.com/api/v1/merchants/payments/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log(`[PAYLOR STATUS] ${transactionId} -> ${data.status}`);

      if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Query failed' });
      }

      return res.status(200).json({ status: data.status });
    } catch (err) {
      console.error(`[PAYLOR STATUS CATCH]`, err);
      return res.status(500).json({ error: err.message });
    }
  }
}
