import React, { useState, useEffect, useRef } from 'react';

export default function Transcriber({ mediaBlobUrl, onMetrics }) {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const doneRef = useRef(false);
  const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually'];

  useEffect(() => {
    if (!mediaBlobUrl || doneRef.current) return;
    doneRef.current = true;

    async function transcribe() {
      setLoading(true);
      try {
        // fetch the blob
        const blob = await fetch(mediaBlobUrl).then(r => r.blob());
        const form = new FormData();
        form.append('file', blob, 'speech.webm');

        // call your proxy
        const res = await fetch('http://localhost:3001/api/transcribe', {
          method: 'POST',
          body: form
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Status ${res.status}`);

        // server now returns { transcript }
        const text = (data.transcript || '').trim();
        setTranscript(text);

        // compute words & fillers
        const words = text.split(/\s+/).filter(Boolean);
        // as a rough proxy, assume 5s if unknown
        const durationSec = (words.length / 2) || 5;
        const wpm = Math.round(words.length / (durationSec / 60));
        const fillerCount = words.reduce((cnt, w) =>
          fillerWords.includes(w.toLowerCase().replace(/[^\w]/g, ''))
            ? cnt + 1
            : cnt
        , 0);

        onMetrics({ transcript: text, wpm, fillerCount });
      } catch (err) {
        console.error('Transcription error:', err);
        setTranscript(`⚠️ ${err.message}`);
        onMetrics({ transcript: '', wpm: 0, fillerCount: 0 });
      } finally {
        setLoading(false);
      }
    }

    transcribe();
  }, [mediaBlobUrl, onMetrics]);

  return (
    <div className="bg-gray-50 p-4 rounded shadow space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Transcript</h2>
        {loading && <span className="text-sm italic">Transcribing…</span>}
      </div>
      <div className="max-h-40 overflow-y-auto p-2 bg-white rounded border">
        {transcript
          ? <p className="text-gray-800">{transcript}</p>
          : <p className="text-gray-500">No transcript yet.</p>
        }
      </div>
    </div>
  );
}
