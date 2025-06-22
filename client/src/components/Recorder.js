import React, { useState, useRef } from 'react';

const Recorder = ({ onStop }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = e => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onStop({ blob });
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div className="space-x-2">
      <button
        onClick={startRecording}
        disabled={recording}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Start
      </button>
      <button
        onClick={stopRecording}
        disabled={!recording}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Stop
      </button>
    </div>
  );
};

export default Recorder;

