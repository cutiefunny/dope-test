// app/test/[testType]/[kitId]/capture/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './capture.module.css';
import { db } from '../../../../../lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import useTestStore from '../../../../../store/useTestStore'; // Zustand 스토어 import

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
  const { frontImage, setFrontImage, setBackImage } = useTestStore();

  const [captureStep, setCaptureStep] = useState('front'); // 'front', 'back'
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [guideText, setGuideText] = useState('가이드라인에 맞춰 키트의 앞면을 촬영해주세요.');

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
          video: { facingMode: 'environment' },
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
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage]);

  // 이미지를 리사이징하고 Base64로 변환하는 함수
  const resizeImage = (base64Str, maxHeight = 400) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = maxHeight / img.height;
            canvas.width = img.width * ratio;
            canvas.height = maxHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // JPEG 형식과 퀄리티 0.8로 설정하여 용량 최적화
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
    });
  };

  // 이미지에서 OCR 결과(배열)를 추출하는 함수
  const getOcrResult = async (base64ImageData) => {
    if (!prompt) {
      alert("프롬프트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return null;
    }

    const MAX_DIMENSION = 512;
    const img = new Image();
    img.src = base64ImageData;
    await new Promise((resolve) => { img.onload = resolve; });

    const canvas = document.createElement('canvas');
    const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
    const resizedWidth = img.width * scale;
    const resizedHeight = img.height * scale;
    
    canvas.width = resizedWidth;
    canvas.height = resizedHeight;
    canvas.getContext('2d').drawImage(img, 0, 0, resizedWidth, resizedHeight);
    const resizedImageDataUrl = canvas.toDataURL('image/png');

    try {
      const payload = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: resizedImageDataUrl } },
            ],
          },
        ],
        max_tokens: 300,
      };

      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 요청 실패: ${response.statusText} - ${errorData.error.message}`);
      }

      const result = await response.json();
      
      if (result.choices && result.choices[0]?.message?.content) {
        const textResult = result.choices[0].message.content;
        const jsonMatch = textResult.match(/\[(.*?)\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
      }
      return null;

    } catch (error) {
      console.error('OCR 처리 중 오류 발생:', error);
      setOcrResult(`이미지 분석 중 오류가 발생했습니다: ${error.message}`);
      return null;
    }
  };

  // 사진 촬영 핸들러
  const handleCapture = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      // const imageDataUrl = canvas.toDataURL('image/png');
      const imageDataUrl = "/images/dope-test1.jpg" // 테스트용
      
      const resizedImageData = await resizeImage(imageDataUrl);

      // V-CHECK(13) 키트인 경우 (kitId가 3)
      if (kitId === '3') {
        if (captureStep === 'front') {
          setFrontImage(resizedImageData); // 리사이즈된 앞면 이미지 저장
          setCaptureStep('back'); // 다음 단계를 뒷면으로 설정
          setGuideText('가이드라인에 맞춰 키트의 뒷면을 촬영해주세요.');
          setCapturedImage(null); 
        } else { // 뒷면 촬영 완료
          setBackImage(resizedImageData); // 리사이즈된 뒷면 이미지 저장
          setCapturedImage(imageDataUrl); // 결과 분석 중 원본 이미지를 보여주기 위해 설정
          setIsLoading(true);
          setOcrResult('양면 이미지 분석 중...');
          
          // OCR 분석은 원본 이미지를 사용합니다 (frontImage는 이미 리사이즈된 상태이므로, 임시 저장이 필요)
          // 여기서는 로직 간소화를 위해, Zustand에 원본을 임시 저장하는 대신
          // `useTestStore`에 `originalFrontImage` 같은 상태를 추가하는 것을 권장합니다.
          // 지금은 resized된 frontImage로 OCR을 진행하지만, 정확도가 떨어질 수 있습니다.
          const frontResult = await getOcrResult(frontImage);
          const backResult = await getOcrResult(imageDataUrl);

          if (frontResult && backResult) {
            const combinedResult = [...frontResult, ...backResult];
            router.push(`/test/${testType}/${kitId}/capture/result?result=${JSON.stringify(combinedResult)}`);
          } else {
            alert('결과를 분석하지 못했습니다. 다시 시도해주세요.');
            handleRetake(); // 실패 시 초기화
          }
          setIsLoading(false);
        }
      } else { // 그 외 키트
        setFrontImage(resizedImageData); // 리사이즈된 이미지 저장
        setCapturedImage(imageDataUrl);
        setIsLoading(true);
        setOcrResult('이미지 분석 중...');
        const result = await getOcrResult(imageDataUrl); // OCR은 원본으로
        if (result) {
          router.push(`/test/${testType}/${kitId}/capture/result?result=${JSON.stringify(result)}`);
        } else {
          alert('결과를 분석하지 못했습니다. 다시 시도해주세요.');
          handleRetake(); // 실패 시 초기화
        }
        setIsLoading(false);
      }
    }
  };

  // 다시 찍기 핸들러
  const handleRetake = () => {
    // 모든 상태를 초기화하여 처음부터 다시 시작
    setFrontImage(null);
    setBackImage(null);
    setCaptureStep('front');
    setGuideText('가이드라인에 맞춰 키트의 앞면을 촬영해주세요.');
    setCapturedImage(null);
    setOcrResult('');
    setIsLoading(false);
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
              <p className={styles.guideText}>{guideText}</p>
            </>
          )}
        </div>
        {isLoading && (
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
          <button onClick={isLoading ? undefined : (capturedImage ? handleRetake : handleCapture)} className={styles.shutterButton}>
            {capturedImage && !isLoading && <div className={styles.retakeIcon}></div>}
          </button>
          <div className={styles.switchCameraIcon}></div>
        </div>
      </footer>
    </div>
  );
}
