import React, { useState, useRef, useEffect } from 'react';
import { ReactMediaRecorder } from 'react-media-recorder';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import Transcriber from './Transcriber';
import FeedbackGenerator from './FeedbackGenerator';
import { getGazeNorm, getEAR } from './faceUtils';

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'user',
};

export default function App() {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [metrics, setMetrics] = useState({
    transcript: '',
    wpm: 0,
    fillerCount: 0,
  });
  const [expressions, setExpressions] = useState(null);

  // New state hooks:
  const [eyeContact, setEyeContact] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);

  const webcamRef   = useRef(null);
  const canvasRef   = useRef(null);
  const detectIntvl = useRef(null);
  const lastBlink   = useRef(false);

  useEffect(() => {
    const MODEL_URL = process.env.PUBLIC_URL + '/models';
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]).then(() => {
      detectIntvl.current = setInterval(async () => {
        const video  = webcamRef.current?.video;
        const canvas = canvasRef.current;
        if (!video || video.readyState !== 4) return;

        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()

        if (!detection) return;

        // resize for drawing
        const dims    = faceapi.matchDimensions(canvas, videoConstraints);
        const resized = faceapi.resizeResults(detection, dims);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, dims.width, dims.height);

        // draw boxes & expressions
        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceExpressions(canvas, resized);

        // expressions
        setExpressions(detection.expressions);

        // gaze / eye-contact
        const gaze = getGazeNorm(detection.landmarks, resized.detection.box);
        // we assume eye-contact when gaze vector is near zero
        setEyeContact(Math.abs(gaze.x) < 0.5 && Math.abs(gaze.y) < 0.35);

        // blink detection by EAR
        const leftEAR  = getEAR(detection.landmarks.getLeftEye());
        const rightEAR = getEAR(detection.landmarks.getRightEye());
        const avgEAR   = (leftEAR + rightEAR) / 2;
        const isBlink  = avgEAR < 0.29;
        if (isBlink && !lastBlink.current) {
          setBlinkCount(c => c + 1);
        }
        lastBlink.current = isBlink;

      }, 500);
    });

    return () => clearInterval(detectIntvl.current);
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center text-green-600">
        Pitch Coach: Audio & Video Analysis
      </h1>

      {/* Audio Recorder */}
      <div className="bg-white rounded shadow p-4 text-center space-y-2">
        <ReactMediaRecorder
          audio
          render={({ status, startRecording, stopRecording, mediaBlobUrl: url }) => {
            if (url && url !== mediaUrl) setMediaUrl(url);
            return (
              <>
                <p>Status: <code>{status}</code></p>
                <button onClick={startRecording} className="btn-green">Start</button>
                <button onClick={stopRecording}  className="btn-red ml-2">Stop</button>
              </>
            );
          }}
        />
      </div>

      {/* Video + Face Analysis */}
      <div className="bg-white rounded shadow p-4">
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            width={videoConstraints.width}
            height={videoConstraints.height}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="rounded-lg border mx-auto"
          />
          <canvas
            ref={canvasRef}
            width={videoConstraints.width}
            height={videoConstraints.height}
            className="absolute top-0 left-0"
          />
        </div>
        {expressions && (
          <div className="mt-2 text-sm text-gray-700 space-x-4">
            😊 Happy: {(expressions.happy * 100).toFixed(1)}% │
            😐 Neutral: {(expressions.neutral * 100).toFixed(1)}% │
            👁️ Eye Contact: {eyeContact ? 'Yes' : 'No'} │
            🙈 Blinks: {blinkCount} │

          </div>
        )}
      </div>

      {/* Transcription & Metrics */}
      {mediaUrl && (
        <Transcriber
          mediaBlobUrl={mediaUrl}
          onMetrics={({ transcript, wpm, fillerCount }) =>
            setMetrics({ transcript, wpm, fillerCount })
          }
        />
      )}

      {metrics.transcript && (
        <div className="bg-white p-4 rounded shadow space-y-1">
          <p>🕒 Pace: <strong>{metrics.wpm} WPM</strong></p>
          <p>🤐 Fillers: <strong>{metrics.fillerCount}</strong></p>
        </div>
      )}

      {/* Coaching Tips */}
      {metrics.transcript && expressions && (
        <FeedbackGenerator
          transcript={metrics.transcript}
          wpm={metrics.wpm}
          fillerCount={metrics.fillerCount}
          expressions={expressions}
        />
      )}
    </div>
  );
}
