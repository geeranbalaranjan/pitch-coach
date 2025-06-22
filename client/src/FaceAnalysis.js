// src/FaceAnalysis.js
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

export default function FaceAnalysis() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [expressions, setExpressions] = useState(null);

  useEffect(() => {
    const MODEL_URL = process.env.PUBLIC_URL + '/models';

    // 1. Load models
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]).then(startDetection);
  }, []);

  const startDetection = () => {
    setInterval(async () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      if (video && video.readyState === 4) {
        // 2. Detect faces + expressions
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        // 3. Resize and draw on canvas
        const dims = faceapi.matchDimensions(canvas, {
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
        });
        const resized = faceapi.resizeResults(detections, dims);

        canvas.getContext('2d').clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceExpressions(canvas, resized);

        // 4. Save the first face's expressions
        if (detections[0]?.expressions) {
          setExpressions(detections[0].expressions);
        }
      }
    }, 500); // run every half second
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="relative">
        <Webcam
          audio={false}
          ref={webcamRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          screenshotFormat="image/jpeg"
          className="rounded-lg border"
        />
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          className="absolute top-0 left-0"
        />
      </div>

      {expressions && (
        <div className="mt-4 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Detected Expressions</h2>
          <ul className="list-disc list-inside">
            {Object.entries(expressions).map(([expr, prob]) => (
              <li key={expr}>
                {expr.charAt(0).toUpperCase() + expr.slice(1)}:{" "}
                {(prob * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
