import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import './App.css';

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [detections, setDetections] = useState([]);

  const runCoco = async () => {
    console.log('Loading model...');
    const net = await cocoSsd.load();
    setModel(net);
    console.log('Model loaded.');
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const obj = await net.detect(video);
      console.log(obj);

      const ctx = canvasRef.current.getContext('2d');
      drawRect(obj, ctx);

      setDetections(prevDetections => {
        const newDetections = [...prevDetections];

        obj.forEach((detection, index) => {
          const detectionId = `${detection.class}-${index}`;
          const existingDetectionIndex = newDetections.findIndex(d => d.id === detectionId);
          if (existingDetectionIndex !== -1) {
            newDetections[existingDetectionIndex].timestamp = Date.now();
          } else {
            newDetections.push({ ...detection, id: detectionId, timestamp: Date.now() });
          }
        });

        return newDetections.filter(detection => Date.now() - detection.timestamp < 3000);
      });
    }
  };

  useEffect(() => {
    runCoco();
  }, []);

  useEffect(() => {
    if (model) {
      const intervalId = setInterval(() => {
        detect(model);
      }, 100);
      return () => clearInterval(intervalId);
    }
  }, [model]);

  const drawRect = (detections, ctx) => {
    detections.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      const text = prediction.class;

      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = '#00FF00';
      ctx.fillText(text, x, y > 10 ? y - 5 : 10);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          muted={true}
          style={{
            textAlign: 'center',
            zIndex: 9,
            width: 700,
            height: 400,
          }}
        />
        <canvas
          ref={canvasRef}
        />
        <div className="detection-box">
          <h3>Detected Objects</h3>
          {detections.map(detection => (
            <div key={detection.id} className="detection">
              {detection.class}
            </div>
          ))}
        </div>
      </header>
    </div>
  );
};

export default App;
