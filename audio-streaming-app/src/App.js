// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
import React, { useState, useRef } from 'react';
import SimplePeer from 'simple-peer';
import AV from './av';



function App() {
  const [stream, setStream] = useState(null);
  const [isFilterOn, setIsFilterOn] = useState(false);
  const myVideoRef = useRef();
  const peerVideoRef = useRef();
  const peerRef = useRef();
  let audioContext, gainNode, filterNode;

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      setStream(stream);
      myVideoRef.current.srcObject = stream;

      // Create an AudioContext and setup nodes for filtering
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      gainNode = audioContext.createGain();
      filterNode = audioContext.createBiquadFilter();

      gainNode.gain.value = 0.75;
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 200;

      // Conditionally apply filter
      if (isFilterOn) {
        source.connect(gainNode).connect(filterNode).connect(audioContext.destination);
      } else {
        source.connect(audioContext.destination);
      }
    } catch (err) {
      console.error('Error accessing media devices.', err);
    }
  };

  const connectToPeer = () => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      // Send this data to the peer through a signaling server or similar
      console.log('SIGNAL', JSON.stringify(data));
    });

    peer.on('stream', (stream) => {
      peerVideoRef.current.srcObject = stream;
    });

    peerRef.current = peer;
  };

  const handleSignalData = (signalData) => {
    try {
      const parsedSignalData = JSON.parse(signalData);
      peerRef.current.signal(parsedSignalData);
    } catch (error) {
      console.error("Invalid signal data format or error in signaling:", error);
    }
  };
  

  const toggleFilter = () => {
    setIsFilterOn(!isFilterOn);
    if (audioContext && stream) {
      if (isFilterOn) {
        audioContext.close();
      } else {
        startStreaming();
      }
    }
  };

  return (
    <div>
      <h1>Audio Streaming App</h1>
      <button onClick={startStreaming}>Start Audio</button>
      <button onClick={connectToPeer}>Connect to Peer</button>
      <audio ref={myVideoRef} autoPlay />
      <audio ref={peerVideoRef} autoPlay />
      <textarea
        placeholder="Paste signal data here"
        onChange={(e) => handleSignalData(e.target.value)}
      />
      <button onClick={toggleFilter}>
        {isFilterOn ? 'Turn Filter Off' : 'Turn Filter On'}
      </button>
        {/* Insert the AudioVisualizer here */}
        {audioContext && <AV audioContext={audioContext} />}
    </div>
  );
}

export default App;
