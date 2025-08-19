'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './capture.module.css';
import { db } from '../../../../../lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';

// 아이콘 SVG 컴포넌트
const FlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33-1.82V15a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
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
  const [prompt, setPrompt] = useState('');

  // Firestore에서 프롬프트 가져오기
  useEffect(() => {
    const fetchPrompt = async () => {
      if (!testType || !kitId) return;
      const promptId = `${testType}-${kitId}`;
      try {
        const docRef = doc(db, 'prompts', promptId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPrompt(docSnap.data().text);
        } else {
          // 기본 프롬프트 설정 또는 에러 처리
          console.warn(`${promptId}에 해당하는 프롬프트를 찾을 수 없습니다.`);
          setPrompt("If two lines are displayed in the test part of the image, -1, if one line is displayed only in C, 1, and in all other cases, 0. Create an array equal to the number of test parts and return it. Just return an array only. no explanation, no text, no other characters, just an array. The image is as follows:");
        }
      } catch (error) {
        console.error("프롬프트 로딩 실패:", error);
      }
    };
    fetchPrompt();
  }, [testType, kitId]);

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
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
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

      handleOCR(imageDataUrl);
    }
  };

  // 다시 찍기 핸들러
  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResult('');
  };

  // Gemini API를 이용한 OCR 처리 및 결과 페이지 이동
  const handleOCR = async (base64ImageData) => {
    if (!prompt) {
      alert("프롬프트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const MAX_DIMENSION = 500;
    const img = new Image();
    img.src = base64ImageData;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
    const resizedWidth = img.width * scale;
    const resizedHeight = img.height * scale;
    
    canvas.width = resizedWidth;
    canvas.height = resizedHeight;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, resizedWidth, resizedHeight);
    
    base64ImageData = canvas.toDataURL('image/png');

    setOcrResult('이미지 분석 중...');
    setIsLoading(true);

    try {
      const base64Data = base64ImageData.split(',')[1];
      
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

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      
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
        const textResult = result.candidates[0].content.parts[0].text;
        const jsonMatch = textResult.match(/\[(.*?)\]/);
        if (jsonMatch) {
            const jsonString = jsonMatch[0];
            const resultArray = JSON.parse(jsonString);
            router.push(`/test/${testType}/${kitId}/capture/result?result=${JSON.stringify(resultArray)}`);
        } else {
            throw new Error("응답에서 배열을 찾을 수 없습니다.");
        }
      } else {
        setOcrResult('텍스트를 인식하지 못했습니다. 다시 시도해주세요.');
      }

    } catch (error) {
      console.error('OCR 처리 중 오류 발생:', error);
      setOcrResult('이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConfirm = () => {
      router.push(`/test/${testType}/${kitId}/capture/result?result=${ocrResult}`);
  }

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
        {(capturedImage && isLoading) && (
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