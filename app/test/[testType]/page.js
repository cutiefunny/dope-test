'use client';

import { useRouter, useParams } from 'next/navigation';
import styles from '../../home/home.module.css';
import commonStyles from '../../common.module.css';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// 각 검사 유형별 키트 데이터
const kitData = {
  urine: [
    { id: 1, name: 'V-CHECK(6)', image: '/images/kit1.png' },
    { id: 3, name: 'V-CHECK(13)', image: '/images/kit1.png' },
  ],
  saliva: [
    { id: 1, name: 'V-CHECK(6)', image: '/images/kit1.png' },
    { id: 2, name: 'V-CHECK(12)', image: '/images/kit1.png' },
  ],
};

// 체크 아이콘 SVG 컴포넌트
const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#2DA3E3"/>
        <path d="M7 12.5L10.5 16L17.5 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export default function TestKitSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const { testType } = params;

  const [pageTitle, setPageTitle] = useState('');
  const [kits, setKits] = useState([]);
  const [selectedKit, setSelectedKit] = useState(null);

  useEffect(() => {
    let currentKits = [];
    if (testType === 'urine') {
      setPageTitle('소변으로 검사하기');
      currentKits = kitData.urine;
      setKits(currentKits);
    } else if (testType === 'saliva') {
      setPageTitle('타액으로 검사하기');
      currentKits = kitData.saliva;
      setKits(currentKits);
    } else {
      router.push('/home');
    }
    // 페이지 로드 시 첫 번째 키트를 기본으로 선택
    if (currentKits.length > 0) {
      setSelectedKit(currentKits[0]);
    }
  }, [testType, router]);

  const handleKitSelect = (kit) => {
    setSelectedKit(kit);
  };

  const handleConfirmSelection = () => {
    if (selectedKit) {
      router.push(`/test/${testType}/${selectedKit.id}`);
    }
  };

  const backIcon = () => (
    <Image src="/images/back.png" alt="Back" width={8} height={15} style={{ marginLeft: '0.5rem' }} />
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push('/home')} className={commonStyles.backButton}>{backIcon()}</button>
        <span className={styles.headerTitle}>{pageTitle}</span>
      </div>

      <div className={styles.contentAreaTest}>
        <div className={styles.titleWrapper}>
            <p className={styles.pageSubtitle}>사용하실 키트를 선택하세요.</p>
        </div>
        
        <div className={styles.kitSelectionContainer}>
          {kits.map((kit) => (
            <div key={kit.id} className={styles.kitWrapper}>
              <div 
                className={`${styles.kitCard} ${selectedKit?.id === kit.id ? styles.selectedKitCard : ''}`}
                onClick={() => handleKitSelect(kit)}
                onKeyDown={(e) => e.key === 'Enter' && handleKitSelect(kit)}
                role="button"
                tabIndex={0}
              >
                {selectedKit?.id === kit.id && (
                  <div className={styles.checkIcon}>
                    <CheckIcon />
                  </div>
                )}
                <div className={styles.kitImageWrapper}>
                  <Image src={kit.image} alt={kit.name} width={150} height={200} style={{objectFit: 'contain'}} />
                </div>
              </div>
              <p className={styles.kitName}>{kit.name}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleConfirmSelection}
        disabled={!selectedKit}
        className={commonStyles.bottomButton}
      >
        선택
      </button>
    </div>
  );
}
