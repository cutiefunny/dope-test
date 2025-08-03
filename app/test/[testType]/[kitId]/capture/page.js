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
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V15a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);


export default function CapturePage() {
  const router = useRouter();
  const params = useParams();
  const { testType, kitId } = params;

  const videoRef = useRef(null);
  
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

  // 사진 촬영 및 리사이즈 핸들러
  const handleCapture = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
  
      // 비디오 스트림이 유효한지 확인
      if (!video.srcObject || video.videoWidth === 0) {
        alert("카메라가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      
      // 리사이즈를 위한 새 캔버스 생성
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 800; // 500x800 크기로 리사이즈
      const context = canvas.getContext('2d');

      // 비디오의 현재 프레임을 500x800 캔버스에 그립니다.
      context.drawImage(video, 0, 0, 500, 800);

      // 리사이즈된 이미지 데이터 URL 생성
      const resizedImageDataUrl = canvas.toDataURL('image/png');
      
      setCapturedImage(resizedImageDataUrl);
      
      // 스트림 정지
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
  
      // OCR 처리
      await handleOCR(resizedImageDataUrl);
    }
  };

  // 다시 찍기 핸들러
  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResult('');
  };

  // Gemini API를 이용한 OCR 처리 및 결과 페이지 이동
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
        
        // Gemini 응답에서 JSON 배열 부분만 추출
        const jsonMatch = textResult.match(/\[(.*?)\]/);
        if (jsonMatch) {
            const jsonString = jsonMatch[0];
            const resultArray = JSON.parse(jsonString);

            // 결과 페이지로 이동
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
    </div>
  );
}