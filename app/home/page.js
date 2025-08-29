'use client';

import { useRouter } from 'next/navigation';
import styles from './home.module.css';
import commonStyles from '../common.module.css';
import useTestStore from '../../store/useTestStore';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const setTestType = useTestStore((state) => state.setTestType);
  const userInfo = useTestStore((state) => state.userInfo);

  const backIcon = () => (
    <Image src="/images/back.png" alt="Back" width={8} height={15} style={{ marginLeft: '0.5rem' }} />
  );

  const handleTestSelection = (type) => {
    setTestType(type);
    if (!userInfo) {
      router.push('/userLogin');
    } else {
      router.push(`/test/${type}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* <div className={styles.header}>
        <button onClick={() => router.push('/')} className={commonStyles.backButton}>{backIcon()}</button>
        <h2 className={styles.headerTitle}></h2>
      </div> */}

      <div className={styles.contentArea}>
        <p className={styles.description}>
          원하시는 키트 유형을 선택하세요.
        </p>
        <div className={styles.buttonContainer}>
          {/* 타액 검사 카드 이미지 */}
          <div
            role="button"
            tabIndex={0}
            className={styles.selectionCard}
            onClick={() => handleTestSelection('saliva')}
            onKeyDown={(e) => e.key === 'Enter' && handleTestSelection('saliva')}
          >
            <Image src="/images/saliva.png" alt="타액으로 검사하기" width={400} height={110} style={{ width: '100%', height: 'auto' }} priority />
          </div>

          {/* 소변 검사 카드 이미지 */}
          <div
            role="button"
            tabIndex={0}
            className={styles.selectionCard}
            onClick={() => handleTestSelection('urine')}
            onKeyDown={(e) => e.key === 'Enter' && handleTestSelection('urine')}
          >
            <Image src="/images/urine.png" alt="소변으로 검사하기" width={400} height={110} style={{ width: '100%', height: 'auto' }} priority />
          </div>
        </div>
      </div>
    </div>
  );
}