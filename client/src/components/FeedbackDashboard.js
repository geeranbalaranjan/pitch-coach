import React from 'react';

const FeedbackDashboard = ({ feedback }) => (
  <div>
    <h2>Pitch Feedback</h2>
    <p><strong>Word Count:</strong> {feedback.word_count}</p>
    <p><strong>WPM:</strong> {feedback.wpm}</p>
    <p><strong>Filler Words:</strong> {feedback.filler_words}</p>
    <p><strong>Repeated Words:</strong> {JSON.stringify(feedback.repeated_words)}</p>
  </div>
);

export default FeedbackDashboard;
