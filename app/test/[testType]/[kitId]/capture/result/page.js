// app/test/[testType]/[kitId]/capture/result/page.js
'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './result.module.css';
import { db } from '../../../../../../lib/firebase/clientApp'; // Firebase db import
import { collection, addDoc } from "firebase/firestore"; // Firestore 함수 import
import useTestStore from '../../../../../../store/useTestStore'; // Zustand 스토어 import

// 각 키트별 검사 항목 이름 데이터
const drugMap = {
  urine: {
    '1': ['BUP', 'MDMA', 'MET', 'MOR', 'COC', 'THC'], // V-CHECK(6)
    '2': ['AMP', 'BUP', 'MDMA', 'MET', 'MOR', 'COC', 'THC'], // V-CHECK(7)
    '3': ['AMP', 'BAR', 'BUP', 'BZO', 'COC', 'MDMA', 'MET', 'MTD', 'OPI', 'PCP', 'PPX', 'TCA', 'THC'], // V-CHECK(13)
  },
  saliva: {
    '1': ['AMP', 'MET', 'THC', 'OPI', 'COC', 'BZO'], // V-CHECK(6)
    '2': ['AMP', 'BAR', 'BUP', 'BZO', 'COC', 'MDMA', 'MET', 'MTD', 'OPI', 'PCP', 'PPX', 'THC'], // V-CHECK(12)
  },
};

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { testType, kitId } = params;
  const userInfo = useTestStore((state) => state.userInfo); // Zustand에서 사용자 정보 가져오기

  const [resultArray, setResultArray] = useState([]);
  const [drugNames, setDrugNames] = useState([]);

  useEffect(() => {
    const resultStr = searchParams.get('result');
    if (resultStr) {
      try {
        const parsedResult = JSON.parse(resultStr);
        setResultArray(parsedResult);
        
        if (drugMap[testType] && drugMap[testType][kitId]) {
          const currentDrugNames = drugMap[testType][kitId];
          setDrugNames(currentDrugNames);
          
          // 사용자 정보와 테스트 결과를 Firestore에 저장
          if (userInfo) {
            saveTestResult(userInfo, parsedResult, currentDrugNames);
          }
        }
      } catch (e) {
        console.error("결과 파싱 에러:", e);
        router.replace('/home');
      }
    } else {
      router.replace('/home');
    }
  }, [searchParams, router, testType, kitId, userInfo]);

  const saveTestResult = async (userInfo, testResultArray, drugNames) => {
    try {
        const testResultData = {
            ...userInfo,
            testType,
            kitId,
            testResult: testResultArray.map((result, index) => ({
                drug: drugNames[index],
                result: getResultText(result).text,
            })),
            createdAt: new Date(),
        };

        // "testResults " -> "testResults"로 수정 (뒤에 공백 제거)
        const docRef = await addDoc(collection(db, "testResults"), testResultData);
        console.log("테스트 결과 저장 성공, 문서 ID: ", docRef.id);
    } catch (error) {
        console.error("Firestore에 테스트 결과 저장 실패:", error);
    }
  };


  const getResultText = (value) => {
    if (value === 1) return { text: '양성', className: styles.positive };
    if (value === -1) return { text: '음성', className: styles.negative };
    return { text: '무효', className: styles.invalid };
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>LOGO</h1>
      </header>
      <main className={styles.mainContent}>
        <h2>검사 결과</h2>
        <div className={styles.resultContainer}>
          <ul className={styles.resultList}>
            {resultArray.map((result, index) => {
              const { text, className } = getResultText(result);
              const drugName = drugNames[index] || `항목 ${index + 1}`;
              return (
                <li key={index} className={styles.resultItem}>
                  <span className={styles.drugName}>{drugName}</span>
                  <span className={`${styles.resultText} ${className}`}>{text}입니다.</span>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      <footer className={styles.footer}>
        <button onClick={() => router.push('/home')} className={styles.exitButton}>
          나가기
        </button>
        <p className={styles.contactText}>관리자에게 문의하세요</p>
      </footer>
    </div>
  );
}
