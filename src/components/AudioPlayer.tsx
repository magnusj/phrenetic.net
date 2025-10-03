import { useRef, useState } from 'react';

interface AudioPlayerProps {
  onAudioReady: (audio: HTMLAudioElement) => void;
}

export const AudioPlayer = ({ onAudioReady }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      setFileName(file.name);
      onAudioReady(audioRef.current);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/') && audioRef.current) {
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      setFileName(file.name);
      onAudioReady(audioRef.current);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} crossOrigin="anonymous" />

      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p>Drop music file here or click to select</p>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="audio-upload"
        />
        <label htmlFor="audio-upload" className="file-label">
          Choose File
        </label>
        {fileName && <p className="file-name">{fileName}</p>}
      </div>

      {fileName && (
        <button onClick={togglePlayPause} className="play-button">
          {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
      )}
    </div>
  );
};
