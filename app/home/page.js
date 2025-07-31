'use client';

import { useRouter } from 'next/navigation';
import styles from './home.module.css';
import commonStyles from '../common.module.css';

export default function HomePage() {
  const router = useRouter();

  // 뒤로가기 아이콘 컴포넌트
  const backIcon = () => (
    <img src="/images/back.png" alt="Back" style={{ width: '8px', height: '15px', marginLeft: '0.5rem' }} />
  );

  return (
    <div className={styles.container}>
      {/* 뒤로가기 버튼 및 타이틀 */}
      <div className={styles.header}>
        <button onClick={() => router.push('/')} className={commonStyles.backButton}>{backIcon()}</button>
        <h2 className={styles.headerTitle}>LOGO</h2>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className={styles.contentArea}>
        <p className={styles.description}>
          원하시는 키트 유형을 선택하세요
        </p>
        <div className={styles.buttonContainer}>
          <button className={styles.kitButton} onClick={() => router.push('/urineTest')}>
            <span className={styles.buttonText}>소변으로 검사하기</span>
            <span className={styles.arrowIcon}>
              <img src="/images/arrow.png" alt="right arrow" style={{ width: '20px', height: '20px' }} />
            </span>
          </button>
          <button className={styles.kitButton} onClick={() => router.push('/salivaTest')}>
            <span className={styles.buttonText}>타액으로 검사하기</span>
            <span className={styles.arrowIcon}>
              <img src="/images/arrow.png" alt="right arrow" style={{ width: '20px', height: '20px' }} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
