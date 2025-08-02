'use client';

import { useRouter, useParams } from 'next/navigation';
import styles from '../../../home/home.module.css';
import commonStyles from '../../../common.module.css';
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
  const { kitId } = params;
  const { testType } = params;
  const name = kitData[testType]?.find(kit => kit.id === parseInt(kitId))?.name || '선택된 키트';

  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    if (testType === 'urine') {
      setPageTitle('소변으로 검사하기');
    } else if (testType === 'saliva') {
      setPageTitle('타액으로 검사하기');
    } else {
      // 유효하지 않은 testType일 경우 홈으로 리디렉션
      router.push('/home');
    }
  }, [testType, router]);

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

            <div className={styles.selectedKit}>
              <p className={styles.kitName}>선택한 키트: {name}</p>
            </div>

            {/* 사진 촬영 버튼 */}
            <button className={styles.captureButton} onClick={() => router.push(`/test/${testType}/${kitId}/capture`)}>
              <span className={styles.captureButtonText}>사진 촬영</span>
            </button>
        </div>
      </div>
    </div>
  );
}
