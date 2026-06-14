import { useEffect, useState } from 'react';

function FocusTracker({ focusSeconds, isDead }) {
  // Determine stage based on time (e.g. 1 min, 5 min, 10 min)
  let stage = 0;
  if (focusSeconds > 60) stage = 1;
  if (focusSeconds > 300) stage = 2;
  if (focusSeconds > 600) stage = 3;

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const points = Math.floor(focusSeconds / 10); // 1 point per 10 seconds

  return (
    <div className="focus-tracker-container glass-panel">
      <div className={`focus-core ${isDead ? 'dead' : `stage-${stage}`}`}></div>
      <div className="core-stats">
        <span className="core-time">{formatTime(focusSeconds)}</span>
        <span className="core-points">+{points} PTS</span>
      </div>
    </div>
  );
}

export default FocusTracker;
