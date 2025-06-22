import React, { useState, useEffect, useRef } from 'react';

export default function FeedbackGenerator({ transcript, wpm, fillerCount }) {
  const [tips, setTips] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const didFetch = useRef(false);

  useEffect(() => {
    if (!transcript || didFetch.current) return;
    didFetch.current = true;

    async function fetchTips() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:3001/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, wpm, fillerCount })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Status ${res.status}`);
        }

        // server now returns { feedback }
        if (typeof data.feedback !== 'string') {
          throw new Error('No tips returned');
        }
        setTips(data.feedback.trim());
      } catch (err) {
        console.error('FeedbackGenerator error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTips();
  }, [transcript, wpm, fillerCount]);

  return (
    <div className="bg-yellow-50 p-4 rounded shadow space-y-2">
      <h2 className="text-lg font-semibold">Coach Tips</h2>

      {loading && <p className="italic">Generating tips…</p>}

      {error && (
        <p className="text-red-600 flex items-center">
          <span className="mr-2">⚠️</span>{error}
        </p>
      )}

      {!loading && !error && tips && (
        <pre className="whitespace-pre-wrap text-sm">{tips}</pre>
      )}
    </div>
  );
}
