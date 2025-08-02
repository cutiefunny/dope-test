// app/home/page.js
'use client';

import { useRouter } from 'next/navigation';
import styles from './home.module.css';
import commonStyles from '../common.module.css';
import useTestStore from '../../store/useTestStore'; // 1. Zustand 스토어 import
import { use } from 'react';

export default function HomePage() {
  const router = useRouter();
  const setTestType = useTestStore((state) => state.setTestType); // 2. 상태를 변경하는 함수 가져오기
  const userInfo = useTestStore((state) => state.userInfo); // 사용자 정보 가져오기

  // 뒤로가기 아이콘 컴포넌트
  const backIcon = () => (
    <img src="/images/back.png" alt="Back" style={{ width: '8px', height: '15px', marginLeft: '0.5rem' }} />
  );

  // 3. 검사 유형 선택 및 페이지 이동을 처리하는 함수
  const handleTestSelection = (type) => {
    setTestType(type); // 선택한 검사 유형을 Zustand 스토어에 저장
    if (!userInfo) {
      // 사용자 정보가 없으면 로그인 페이지로 이동
      router.push('/userLogin');
    }else {
      // 사용자 정보가 있으면 검사 유형 페이지로 이동
      router.push(`/test/${type}`);
    }
  };

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
          {/* 4. onClick 핸들러를 새로운 함수로 교체 */}
          <button className={styles.kitButton} onClick={() => handleTestSelection('urine')}>
            <span className={styles.buttonText}>소변으로 검사하기</span>
            <span className={styles.arrowIcon}>
              <img src="/images/arrow.png" alt="right arrow" style={{ width: '20px', height: '20px' }} />
            </span>
          </button>
          <button className={styles.kitButton} onClick={() => handleTestSelection('saliva')}>
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