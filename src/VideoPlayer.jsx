import { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';

function VideoPlayer({ videoUrl, onEnd, isPlaying }) {
  const playerRef = useRef(null);
  const [videoId, setVideoId] = useState('');

  useEffect(() => {
    // Extract video ID from URL
    try {
      let id = '';
      if (videoUrl.includes('youtu.be/')) {
        id = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      } else if (videoUrl.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(videoUrl).search);
        id = urlParams.get('v');
      }
      setVideoId(id || '');
    } catch (e) {
      console.error("Invalid URL");
    }
  }, [videoUrl]);

  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
    },
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  return (
    <div className="video-player-wrapper">
      {videoId ? (
        <>
          <YouTube 
            videoId={videoId} 
            opts={opts} 
            onReady={onReady} 
            onEnd={onEnd}
            className="youtube-container"
            style={{ width: '100%', height: '100%' }}
          />
          {/* Transparent overlay to block clicks on the iframe */}
          <div className="video-overlay"></div>
        </>
      ) : (
        <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          Loading video...
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
