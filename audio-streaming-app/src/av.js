import React, { useEffect, useRef } from 'react';

function AV({ audioContext }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    if (audioContext) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current = analyser;

      const drawWaveform = () => {
        requestAnimationFrame(drawWaveform);

        analyser.getByteTimeDomainData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00f';
        ctx.beginPath();
        const sliceWidth = (canvas.width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      drawWaveform();
    }
  }, [audioContext]);

  return <canvas ref={canvasRef} width="600" height="200" />;
}

export default AV;
