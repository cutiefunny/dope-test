// app/test/[testType]/[kitId]/capture/result/page.js
'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './result.module.css';

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

  const [resultArray, setResultArray] = useState([]);
  const [drugNames, setDrugNames] = useState([]);

  console.log('result array:', resultArray);

  useEffect(() => {
    const resultStr = searchParams.get('result');
    if (resultStr) {
      try {
        const parsedResult = JSON.parse(resultStr);
        setResultArray(parsedResult);
        // testType과 kitId에 맞는 약물 이름 목록을 가져옵니다.
        if (drugMap[testType] && drugMap[testType][kitId]) {
          setDrugNames(drugMap[testType][kitId]);
        }
      } catch (e) {
        console.error("결과 파싱 에러:", e);
        // 에러 발생 시 홈으로 이동
        router.replace('/home');
      }
    } else {
        // 결과값이 없으면 홈으로 이동
        router.replace('/home');
    }
  }, [searchParams, router, testType, kitId]);

  const getResultText = (value) => {
    if (value === 1) return { text: '양성입니다.', className: styles.positive };
    if (value === -1) return { text: '음성입니다.', className: styles.negative };
    return { text: '무효입니다.', className: styles.invalid };
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
                  <span className={`${styles.resultText} ${className}`}>{text}</span>
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