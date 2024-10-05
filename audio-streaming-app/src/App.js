
import React, { useState, useRef, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import AV from './av';
import './styles.css'

function App() {
  const [stream, setStream] = useState(null);
  const [isFilterOn, setIsFilterOn] = useState(false);
  const myVideoRef = useRef();
  const peerVideoRef = useRef();
  const peerRef = useRef();
  let audioContext, gainNode, filterNode;
  const [devices,setDevices] = useState({inputs:[], outputs:[]});
  const [selectedInputDevice, setSelectedInputDevice] = useState(null);
  

  const getDevices = async () =>{
    //Retrives and updates the state with available audio input and output devices
    const deviceInfos =  await navigator.mediaDevices.enumerateDevices();
    const audioInputs = deviceInfos.filter((d) => d.kind ==='audioinput');
    const audioOutputs = deviceInfos.filter((d) => d.kind ==='audiooutput');
    setDevices({
      inputs: audioInputs,
      outputs: audioOutputs,
    });
  }

  const startStreaming = async () => {
    //Capture audio from the selected device while disabling video, with error handling
    try {
      const constraints = {
        audio:{
          deviceId: selectedInputDevice ? { exact: selectedInputDevice} : undefined
        },
        video: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(stream);
      myVideoRef.current.srcObject = stream;

      //setting up web audio API filters
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      gainNode = audioContext.createGain();
      filterNode = audioContext.createBiquadFilter();

      gainNode.gain.value = 0.75;
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 200;

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
    //connects to peer using WebRTC and streams audio
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => { 
      //Exchange signal data for peer
      console.log('SIGNAL', JSON.stringify(data)); 
    });

    peer.on('stream', (stream) => {
      //To play the incoming stream from peer
      peerVideoRef.current.srcObject = stream;
    });

    peerRef.current = peer;
  };

  const handleSignalData = (signalData) => {
    //handles incoming signaling data for peer connection
    try {
      const parsedSignalData = JSON.parse(signalData);
      peerRef.current.signal(parsedSignalData);
    } catch (error) {
      console.error("Invalid signal data format or error in signaling:", error);
    }
  };

  const toggleFilter = () => {
    //toggle filter (gain + frequency)
    setIsFilterOn(!isFilterOn);
    if (audioContext && stream) {
      if (isFilterOn) {
        audioContext.close();
      } else {
        startStreaming();
      }
    }
  };
  const changeOutputDevice =(deviceId) =>{
    //sets the audio output device to the selected one
    const audioElement = myVideoRef.current;
    if(audioElement.setSinkId){
      audioElement.setSinkId(deviceId)
      .then(() => console.log(`Output device set to ${deviceId}`))
      .catch(err => console.error('Error setting output device', err))
    }else{
      console.warn('setSinkId() is not supported by browser');
    }
  };

  useEffect(() =>{
    //fetch audio input and output devices on the mount 
    getDevices();
  }, []);

  return (
    <div className="app-container">
      <h1>🎶 Audio Streaming App 🎶</h1>
      <div className="input-output-select">
        <h3> Select Audio Input:  </h3>
          <select onChange={(e) => setSelectedInputDevice(e.target.value)}>
            {devices.inputs.length > 0 ?(
            devices.inputs.map((d) =>(
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${d.deviceId}`}
            </option>
          ))
        ):(
            <option> No audio input devices found</option>
          )}
          </select>
        <h3> Select Audio Output:  </h3>
        
          <select onChange={(e) => changeOutputDevice(e.target.value)}>
          {devices.outputs.length > 0 ? (
            devices.outputs.map((d) =>(
          //  {devices.filter((d) => d.kind ==='audiooutput').map((d) =>(
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Speaker ${d.deviceId}`}
            </option>
          ))
        
        ):(
        <option>no audio output devices found</option>)
      }
      </select>
</div>

      <div className="buttons-container">
        <button onClick={startStreaming}>🎤 Start Audio</button>
       
        <button onClick={connectToPeer}>🔗 Connect to Peer</button>

        <button onClick={toggleFilter}>
          {isFilterOn ? '🎚️ Turn Filter Off' : '🎛️ Turn Filter On'}
        </button>
      </div>
      <div className="audio-container">
        <audio ref={myVideoRef} autoPlay />
        <audio ref={peerVideoRef} autoPlay />
      </div>
      <textarea
        placeholder="Paste signal data here"
        onChange={(e) => handleSignalData(e.target.value)}
        className="signal-input"
      />
      {audioContext && <AV audioContext={audioContext} />}
    </div>
  );
}

export default App;