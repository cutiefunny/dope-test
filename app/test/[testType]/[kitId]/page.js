'use client';

import { useRouter, useParams } from 'next/navigation';
import styles from './page.module.css'; // 이 페이지의 전용 스타일 import
import commonStyles from '../../../common.module.css';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// 각 검사 유형별 키트 데이터 (이미지 경로 추가)
const kitData = {
  urine: [
    { id: 1, name: 'V-CHECK(6)', image: '/images/kit1.png' },
    // { id: 2, name: 'V-CHECK(7)' }, //고객 요청으로 주석 처리
    { id: 3, name: 'V-CHECK(13)', image: '/images/kit1.png' },
  ],
  saliva: [
    { id: 1, name: 'V-CHECK(6)', image: '/images/kit1.png' },
    { id: 2, name: 'V-CHECK(12)', image: '/images/kit1.png' },
  ],
};

export default function TestKitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { kitId, testType } = params;

  const [kitInfo, setKitInfo] = useState(null);
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    if (testType && kitId) {
      const kit = kitData[testType]?.find(k => k.id === parseInt(kitId));
      if (kit) {
        setKitInfo(kit);
        setPageTitle(testType === 'urine' ? '소변으로 검사하기' : '타액으로 검사하기');
      } else {
        router.push('/home');
      }
    }
  }, [testType, kitId, router]);

  // 뒤로가기 아이콘 컴포넌트
  const backIcon = () => (
      <Image src="/images/back.png" alt="Back" width={8} height={15} style={{ marginLeft: '0.5rem' }} />
    );

  if (!kitInfo) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push(`/test/${testType}`)} className={commonStyles.backButton}>{backIcon()}</button>
        <span className={styles.headerTitle}>{pageTitle}</span>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.kitCard}>
          <Image
            src={kitInfo.image}
            alt={kitInfo.name}
            width={180}
            height={220}
            style={{ objectFit: 'contain' }}
          />
        </div>
        <p className={styles.kitName}>{kitInfo.name}</p>

        <div className={styles.usageGuide}>
          <h3 className={styles.usageTitle}>사용법 안내</h3>
          <p className={styles.usageDescription}>
            해당 키트에 대한<br />
            소개 및 사용법<br />
            안내문구 입니다.
          </p>
        </div>
      </div>

      <button
        className={commonStyles.bottomButton}
        onClick={() => router.push(`/test/${testType}/${kitId}/capture`)}
      >
        사진 촬영
      </button>
    </div>
  );
}
