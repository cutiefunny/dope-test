'use client';

import { useRouter, useParams } from 'next/navigation';
import styles from '../../home/home.module.css';
import commonStyles from '../../common.module.css';
import { useEffect, useState } from 'react';
import Image from 'next/image'; // Image 컴포넌트 import

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

export default function TestKitSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const { testType } = params;

  const [pageTitle, setPageTitle] = useState('');
  const [kits, setKits] = useState([]);

  useEffect(() => {
    if (testType === 'urine') {
      setPageTitle('소변으로 검사하기');
      setKits(kitData.urine);
    } else if (testType === 'saliva') {
      setPageTitle('타액으로 검사하기');
      setKits(kitData.saliva);
    } else {
      router.push('/home');
    }
  }, [testType, router]);

  const handleKitSelect = (kit) => {
    router.push(`/test/${testType}/${kit.id}`);
  };

  const backIcon = () => (
    <Image src="/images/back.png" alt="Back" width={8} height={15} style={{ marginLeft: '0.5rem' }} />
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={commonStyles.backButton}>{backIcon()}</button>
        <span className={styles.headerTitle}>{pageTitle}</span>
      </div>

      <div className={styles.contentAreaTest}>
        <div className={styles.titleWrapper}>
            <p className={styles.pageSubtitle}>사용하실 키트를 선택하세요.</p>
        </div>
        
        <div className={styles.kitSliderContainer}>
          <div className={styles.kitSlider}>
            {kits.map((kit) => (
              <div key={kit.id} >
                <div 
                  className={styles.kitCard}
                  onClick={() => handleKitSelect(kit)}
                  onKeyDown={(e) => e.key === 'Enter' && handleKitSelect(kit)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.kitImageWrapper}>
                    <Image src={kit.image} alt={kit.name} width={150} height={200} style={{objectFit: 'contain'}} />
                  </div>
                </div>
                <p className={styles.kitName}>{kit.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}