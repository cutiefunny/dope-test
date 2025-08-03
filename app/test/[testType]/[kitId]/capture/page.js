'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './capture.module.css';

// 아이콘 SVG 컴포넌트
const FlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export default function CapturePage() {
  const router = useRouter();
  const params = useParams();
  const { testType, kitId } = params;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 카메라 스트림 시작
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // 후면 카메라 사용
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('카메라 접근에 실패했습니다.', error);
        alert('카메라를 사용할 수 없습니다. 권한을 확인해주세요.');
      }
    };

    if (!capturedImage) {
      startCamera();
    }

    return () => {
      // 컴포넌트 언마운트 시 스트림 정지
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage]);

  // 사진 촬영 핸들러
  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      let imageDataUrl = canvas.toDataURL('image/png');
      setCapturedImage(imageDataUrl);
      
      // 스트림 정지
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      //테스트를 위해 /images/sample.jpg를 base64로 형태로 변환하여 imageDataUrl에 할당
      const response = await fetch('/images/sample.jpg');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        imageDataUrl = reader.result;
        handleOCR(imageDataUrl);
      };
    }
  };

  // 다시 찍기 핸들러
  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResult('');
  };

  // Gemini API를 이용한 OCR 처리
  const handleOCR = async (base64ImageData) => {
    setIsLoading(true);
    setOcrResult('이미지를 분석 중입니다...');

    try {
      const base64Data = base64ImageData.split(',')[1];
      const prompt = "In the image, if the test part is positive, write 1, if it is negative, write -1, if it is invalid, write 0, in that order and return it as an array. For example [1,1,0,0,1,0], only array.";

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data
                }
              }
            ]
          }
        ],
      };

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY; // API 키
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
        const text = result.candidates[0].content.parts[0].text;
        setOcrResult(text);
      } else {
        setOcrResult('텍스트를 인식하지 못했습니다. 다시 시도해주세요.');
      }

    } catch (error) {
      console.error('OCR 처리 중 오류 발생:', error);
      setOcrResult('이미지 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <FlashIcon />
        <h1 className={styles.title}>사진 촬영 모드</h1>
        <SettingsIcon />
      </header>

      <main className={styles.mainContent}>
        <div className={styles.cameraView}>
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className={styles.previewImage} />
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline className={styles.video}></video>
              <div className={styles.guideBox}></div>
            </>
          )}
        </div>
        {capturedImage && (
            <div className={styles.ocrResultBox}>
                <p>{ocrResult}</p>
            </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.modeSelector}>
          <span>동영상</span>
          <span className={styles.activeMode}>사진</span>
          <span>더보기</span>
        </div>
        <div className={styles.controls}>
          <div className={styles.galleryIcon}></div>
          <button onClick={capturedImage ? handleRetake : handleCapture} className={styles.shutterButton}>
            {capturedImage && <div className={styles.retakeIcon}></div>}
          </button>
          <div className={styles.switchCameraIcon}></div>
        </div>
      </footer>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}
