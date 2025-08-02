'use client';

import { useRouter, useParams } from 'next/navigation';
import styles from '../../home/home.module.css';
import commonStyles from '../../common.module.css';
import { useEffect, useState } from 'react';

// 각 검사 유형별 키트 데이터
const kitData = {
  urine: [
    { id: 1, name: 'V-CHECK(6)' },
    { id: 2, name: 'V-CHECK(7)' },
    { id: 3, name: 'V-CHECK(13)' },
  ],
  saliva: [
    { id: 1, name: 'V-CHECK(6)' },
    { id: 2, name: 'V-CHECK(12)' },
  ],
};

// 뒤로가기 아이콘 컴포넌트
  const ArrowL = () => (
    <img src="/images/ArrowL.png" alt="Back" style={{ width: '20px', height: '20px', marginLeft: '0.5rem' }} />
  );

export default function TestKitSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const { testType } = params;

  const [pageTitle, setPageTitle] = useState('');
  const [kits, setKits] = useState([]);
  const [selectedKit, setSelectedKit] = useState(null);

  useEffect(() => {
    if (testType === 'urine') {
      setPageTitle('소변으로 검사하기');
      setKits(kitData.urine);
    } else if (testType === 'saliva') {
      setPageTitle('타액으로 검사하기');
      setKits(kitData.saliva);
    } else {
      // 유효하지 않은 testType일 경우 홈으로 리디렉션
      router.push('/home');
    }
  }, [testType, router]);

  const handleKitSelect = (kit) => {
    setSelectedKit(kit);
    // 선택된 키트 정보를 가지고 다음 페이지로 이동 (예: /test/urine/1)
    // router.push(`/test/${testType}/${kit.id}`);
    console.log('Selected Kit:', kit);
  };
  
  // 뒤로가기 아이콘 컴포넌트
  const backIcon = () => (
    <img src="/images/back.png" alt="Back" style={{ width: '8px', height: '15px', marginLeft: '0.5rem' }} />
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={commonStyles.backButton}>{backIcon()}</button>
        <h2 className={styles.headerTitle}>LOGO</h2>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.contentWrapper}>
            <div className={styles.titleWrapper}>
                <span className={styles.pageTitle}>{pageTitle}</span>
                <button onClick={() => router.back()} className={commonStyles.backButton}>{ArrowL()}</button>
            </div>
                <div className={styles.kitGrid}>
                {kits.map((kit) => (
                    <div 
                    key={kit.id} 
                    className={`${styles.kitCard} ${selectedKit?.id === kit.id ? styles.selected : ''}`}
                    onClick={() => handleKitSelect(kit)}
                    >
                    <div className={styles.kitImagePlaceholder}></div>
                    <p className={styles.kitName}>{kit.name}</p>
                    </div>
                ))}
                </div>
            <p>사용 할 키트 선택하세요.</p>
        </div>
      </div>
    </div>
  );
}
