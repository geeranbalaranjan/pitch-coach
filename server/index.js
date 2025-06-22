// server/index.js
import 'dotenv/config';             // loads OPENAI_KEY from .env
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import FormData from 'form-data';

const app    = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_KEY;
if (!OPENAI_KEY) console.warn('🔑 OPENAI_KEY is not set');

//
// 1) Transcription (Whisper)
//
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  console.log('▶️  /api/transcribe hit');
  try {
    const form = new FormData();
    form.append('file', req.file.buffer, 'speech.webm');
    form.append('model', 'whisper-1');

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: form
    });
    const data = await r.json();
    console.log('📬 Whisper status:', r.status, data);

    if (data.error) {
      return res.status(502).json({ error: data.error.message });
    }
    res.json({ transcript: data.text || data.transcript });
  } catch (err) {
    console.error('💥 Whisper error', err);
    res.status(500).json({ error: err.message });
  }
});

//
// 2) Feedback (Chat Completion)
//
app.post('/api/feedback', async (req, res) => {
  console.log('▶️  /api/feedback hit');
  const { transcript, wpm, fillerCount } = req.body;

  const systemPrompt = `You are an expert public‐speaking coach.`;
  const userPrompt   = `Here's my pitch (WPM: ${wpm}, fillers: ${fillerCount}):\n\n"${transcript}"\n\nPlease give me three concrete tips on delivery, content, and audience engagement. Do not include any introductory or closing sentences`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',   // or 'gpt-3.5-turbo' etc.
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 512
      })
    });

    const j = await r.json();
    console.log('🐬 Chat status:', r.status, j);

    if (j.error) {
      return res.status(502).json({ error: j.error.message });
    }
    const feedback = j.choices?.[0]?.message?.content?.trim();
    if (!feedback) {
      return res.status(502).json({ error: 'No feedback returned' });
    }
    res.json({ feedback });
  } catch (err) {
    console.error('💥 Feedback error', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Proxy listening on http://localhost:${PORT}`);
});
