'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css'; // CSS Modules 임포트
import { useRouter } from 'next/navigation'; // Next.js 라우터 사용

export default function Home() {
  // 현재 화면 상태를 관리하는 state
  const [screen, setScreen] = useState('splash');

  const router = useRouter(); // 라우터 인스턴스 생성

  useEffect(() => {
    // 클라이언트 측에서만 실행되도록 useEffect 내부에서 localStorage에 접근
    const hasVisited = localStorage.getItem('hasVisited');
    if (hasVisited) {
      // 이미 방문한 경우 바로 메인 화면으로 이동
      setScreen('main');
    } else {
      // 첫 방문인 경우 스플래시 화면 표시 후 순차적으로 이동
      const timer = setTimeout(() => {
        setScreen('intro');
      }, 3000); // 3초 후 인트로 화면으로 전환
      return () => clearTimeout(timer);
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행되도록 빈 배열 전달

  // 인트로 화면에서 다음 버튼 클릭 시
  const handleNextIntro = () => {
    setScreen('privacy');
  };

  // 개인정보 처리방침 화면에서 시작하기 버튼 클릭 시
  const handleStartApp = () => {
    localStorage.setItem('hasVisited', 'true'); // 첫 방문 기록
    setScreen('main');
  };

  return (
    <div className={styles.screenContainer}> {/* 전체 화면 컨테이너 */}
      {screen === 'splash' && (
        <div className={styles.splashContent}> {/* 스플래시 화면 컨테이너 */}
          {/* 스플래시 화면 */}
          <Image
            src="/images/splash.jpg" // 실제 스플래시 이미지 경로로 변경하세요.
            alt="App Splash Screen"
            fill // 부모 요소를 꽉 채우도록 설정
            priority
            className={styles.splashImage} // 이미지 자체에 스타일을 적용할 클래스
          />
        </div>
      )}

      {screen === 'intro' && (
        <div className={styles.card}> {/* 어플 소개 화면 카드 */}
          <div />
          {/* 어플 소개 화면 */}
          <div>
          <Image
            src="/images/logo.jpg" // 어플 소개 화면 이미지 경로
            alt="App Introduction Screen"
            width={150}
            height={150}
            priority
            className={styles.logo}
          />
          <p className={styles.description}>
            AI 기반 마약 진단 앱으로, <br />언제 어디서든 빠르고 정확하게 <br />약물 반응을 분석하고 확인하세요.
          </p>
          </div>
          <button
            onClick={handleNextIntro}
            className={styles.button}
          >
            다음
          </button>
        </div>
      )}

      {screen === 'privacy' && (
        <div className={styles.card}> {/* 개인정보 처리방침 화면 카드 */}
          <div />
          {/* 개인정보 처리방침 화면 */}
          <div>
          <Image
            src="/images/secure.jpg" // 개인정보 처리방침 화면 이미지 경로
            alt="Privacy Policy Screen"
            width={150}
            height={150}
            priority
            className={styles.logo}
          />
          <p className={styles.description}>
            개인정보 처리 방침<br />모든 데이터는 보안을 위해 암호화되어 저장됩니다.
          </p>
          </div>
          <button
            onClick={handleStartApp}
            className={styles.button}
          >
            시작하기
          </button>
        </div>
      )}

      {screen === 'main' && (
        <div className={styles.mainScreenContainer}> {/* 메인 화면 컨테이너 */}
          <h1 className={styles.mainScreenLogoTop}>LOGO</h1> {/* 상단 로고 */}
          <div className={styles.mainButtonsContainer}> {/* 버튼 컨테이너 */}
            <button className={styles.mainButton} onClick={() => router.push('/userLogin')}>개인용 (자가 진단)</button>
            <button className={styles.mainButton} onClick={() => router.push('/adminLogin')}>단체용 (관리자)</button>
          </div>
          <h1 className={styles.mainScreenLogoBottom}>LOGO</h1> {/* 하단 로고 */}
        </div>
      )}
    </div>
  );
}
