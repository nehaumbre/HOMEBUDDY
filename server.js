import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// Proxy Gemini API
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(500).json({ error: 'API KEY MISSING!' });
  }

  const userMsg = req.body.userMsg;
  const roomName = req.body.roomName || 'unspecified';
  const currency = req.body.currency || '₹';
  const existing = req.body.existing || 'none';
  const categories = req.body.categories || "Furniture, Appliances, Decor";
  
  const systemPrompt = `You are HomeBot, a practical home-setup advisor. RETRO POP style.
Context: Room: ${roomName}, Currency: ${currency}, Existing: ${existing}.
CATEGORIES: ${categories}.
PRIORITIES: necessary, later, wishlist.
RESPONSE: 2 sentences max + JSON block of items. Realistic prices in ${currency}.
\`\`\`json
[{"name":"Item","price":100,"priority":"necessary","category":"Furniture","reason":"Reason"}]
\`\`\``;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt + "\nUser: " + userMsg }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1000 }
        })
      }
    );
    
    if (!response.ok) {
        return res.status(response.status).json({ error: 'GEMINI API ERROR' });
    }
    
    const resData = await response.json();
    const text = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: 'NETWORK ERROR' });
  }
});

// For Vue router history mode
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
