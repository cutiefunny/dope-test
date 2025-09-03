// app/test/[testType]/[kitId]/capture/result/page.js
'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './result.module.css';
import { db } from '../../../../../../lib/firebase/clientApp'; 
import { collection, addDoc } from "firebase/firestore"; 
import useTestStore from '../../../../../../store/useTestStore';
import Image from 'next/image';

// 각 키트별 검사 항목 이름 데이터 (한글 이름 수정)
const drugMap = {
  urine: {
    '1': ['엑스터시', '아편', '필로폰', '코카인', '케타민', '대마'],
    '2': ['암페타민', '부프레노르핀', '엑스터시', '필로폰', '모르핀', '코카인', '대마'],
    '3': ['아편', '엑스터시', '코티닌', '펜타닐', '코카인', '벤조디아제핀', '암페타민', '케타민', '부프레노르핀', 'LSD', '필로폰', '대마']
  },
  saliva: {
    '1': ['아편', '케타민', '엑스터시', '코카인', '필로폰', '대마'],
    '2': ['아편', '코카인', '암페타민', '필로폰', '벤조디아제핀', '대마', '케타민', '엑스터시', '펜타닐', '바르비투르산'],
  },
};

// 마약 종류별 6각형 아이콘 색상 매칭
const drugColorMap = {
  '필로폰': '#3570B8',
  '코카인': '#919191',
  '대마': '#FF8888',
  '엑스터시': '#43E2A0',
  'LSD': '#8543E2',
  '펜타닐': '#E23882',
  '암페타민': '#884141',
  '바르비투르산': '#FFAB52', 
  '부프레노르핀': '#BDE243',
  '벤조디아제핀': '#43254A',
  '아편': '#FF8888', 
  '케타민': '#43E2A0',
  '모르핀': '#8543E2',
  '코티닌': '#9CA3AF', 
  '기타': '#9CA3AF', 
};


// 6각형 아이콘 SVG 컴포넌트
const HexagonIcon = ({ color }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.9999 0.5L23.3204 6.99999L23.3204 19L11.9999 25.5L0.679443 19L0.679443 6.99999L11.9999 0.5Z" fill={color}/>
    </svg>
);

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { testType, kitId } = params;
  
  // --- ▼ [수정] Zustand 스토어 상태를 개별적으로 구독 ▼ ---
  const userInfo = useTestStore((state) => state.userInfo);
  const frontImage = useTestStore((state) => state.frontImage);
  const backImage = useTestStore((state) => state.backImage);
  const retakeChances = useTestStore((state) => state.retakeChances);
  const decrementRetakeChances = useTestStore((state) => state.decrementRetakeChances);
  const resetStore = useTestStore((state) => state.resetStore);
  // --- ▲ [수정] Zustand 스토어 상태를 개별적으로 구독 ▲ ---

  const [resultArray, setResultArray] = useState([]);
  const [drugNames, setDrugNames] = useState([]);
  const [showRetakeLimitModal, setShowRetakeLimitModal] = useState(false);

  useEffect(() => {
    const resultStr = searchParams.get('result');
    if (!resultStr) return;

    try {
      const parsedResult = JSON.parse(resultStr);
      setResultArray(parsedResult);
      
      const currentDrugNames = drugMap[testType]?.[kitId];
      if (currentDrugNames) {
        setDrugNames(currentDrugNames);
        
        // 스토어에서 직접 최신 userInfo를 가져와 사용합니다.
        const currentUserInfo = useTestStore.getState().userInfo;
        if (currentUserInfo && useTestStore.getState().retakeChances === 3) {
          saveTestResult(currentUserInfo, parsedResult, currentDrugNames);
        }
      }
    } catch (e) {
      console.error("결과 파싱 에러:", e);
    }
  }, [searchParams, testType, kitId]); 

  const saveTestResult = async (userInfo, testResultArray, drugNames) => {
    try {
        const testResultData = {
            ...userInfo, testType, kitId,
            testResult: testResultArray.map((result, index) => ({
                drug: drugNames[index],
                result: getResultText(result).text,
            })),
            createdAt: new Date(),
            // 리사이징된 Base64 이미지 추가
            capturedImage: frontImage || null,
            capturedImageBack: backImage || null,
        };
        await addDoc(collection(db, "testResults"), testResultData);
    } catch (error) {
        console.error("Firestore에 테스트 결과 저장 실패:", error);
    }
  };

  const getResultText = (value) => {
    if (value === 1) return { text: '양성', className: styles.positive };
    if (value === -1) return { text: '음성', className: styles.negative };
    return { text: '무효', className: styles.invalid };
  };

  const handleRetakeClick = () => {
    decrementRetakeChances();
    router.push(`/test/${testType}/${kitId}/capture`);
  };

  const handleExitClick = () => {
    resetStore();
    router.push('/home');
  };

  const handleExitToKitPage = () => {
    router.push(`/test/${testType}/${kitId}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>검사결과</h1>
      </header>
      <main className={styles.mainContent}>
        <div className={styles.resultContainer}>
          <ul className={styles.resultList}>
            {resultArray.map((result, index) => {
              const { text, className } = getResultText(result);
              const drugName = drugNames[index] || `항목 ${index + 1}`;
              const iconColor = drugColorMap[drugName] || drugColorMap['기타'];

              return (
                <li key={index} className={styles.resultItem}>
                  <div className={styles.hexagonIcon}>
                    <HexagonIcon color={iconColor} />
                  </div>
                  <span className={styles.drugName}>{drugName}</span>
                  <span className={`${styles.resultText} ${className}`}>
                    {result === 1 && (
                      <Image src="/images/check.png" alt="positive" width={16} height={16} className={styles.checkIcon} />
                    )}
                    {text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      <footer className={styles.footer}>
        {retakeChances > 0 ? (
          <>
            <p className={styles.retakeChancesText}>재촬영 기회 {retakeChances}번</p>
            <button onClick={handleRetakeClick} className={styles.retakeButton}>
              재촬영
            </button>
            <button onClick={handleExitToKitPage} className={styles.exitButton}>
              나가기
            </button>
          </>
        ) : (
          <>
            <p className={styles.retakeChancesText}>재촬영 기회를 모두 사용했습니다.</p>
            <button onClick={() => setShowRetakeLimitModal(true)} className={styles.retakeButton}>
              나가기
            </button>
          </>
        )}
      </footer>

      {showRetakeLimitModal && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <p className={styles.modalMessage}>
                    재촬영은 3번까지만 가능합니다.<br/>관리자에게 문의해주세요.
                </p>
                <button onClick={handleExitClick} className={styles.modalButton}>나가기</button>
            </div>
        </div>
      )}
    </div>
  );
}
