// src/faceUtils.js

// Compute the centroid of an array of {x,y} points
export function getEyeCenter(points) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

// Given face-api.js landmarks and the bounding box, return a normalized gaze vector:
// positive x means looking right, y means looking down.
export function getGazeNorm(landmarks, box) {
  const leftEyePts  = landmarks.getLeftEye();
  const rightEyePts = landmarks.getRightEye();
  const nosePts     = landmarks.getNose();

  const lC = getEyeCenter(leftEyePts);
  const rC = getEyeCenter(rightEyePts);
  const avgEye = { x: (lC.x + rC.x) / 2, y: (lC.y + rC.y) / 2 };
  // nose tip is around index 6
  const noseTip = nosePts[6];

  const dx = avgEye.x - noseTip.x;
  const dy = avgEye.y - noseTip.y;
  return { x: dx / box.width, y: dy / box.height };
}

// Eye Aspect Ratio (EAR) for blink detection
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
export function getEAR(eyePts) {
  // eyePts is an array of 6 points
  const A = dist(eyePts[1], eyePts[5]);
  const B = dist(eyePts[2], eyePts[4]);
  const C = dist(eyePts[0], eyePts[3]);
  return (A + B) / (2 * C);
}

