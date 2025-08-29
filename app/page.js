'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [screen, setScreen] = useState('splash');
  const router = useRouter();

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (hasVisited) {
      setScreen('main');
    } else {
      const timer = setTimeout(() => {
        setScreen('intro');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNextIntro = () => {
    setScreen('privacy');
  };

  const handleStartApp = () => {
    localStorage.setItem('hasVisited', 'true');
    setScreen('main');
  };

  return (
    <div className={styles.screenContainer}>
      {screen === 'splash' && (
        <div className={styles.splashContent}>
          <Image
            src="/images/icon-512.png"
            alt="App Splash Screen"
            width={350}
            height={300}
            priority
            className={styles.splashImage}
          />
        </div>
      )}

      {screen === 'intro' && (
        <div className={styles.card}>
          <div />
          <div>
            <Image
              src="/images/logo2.png"
              alt="App Introduction Screen"
              width={350}
              height={120}
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
        <div className={styles.card}>
          <div />
          <div>
            <Image
              src="/images/logo2.png"
              alt="App Introduction Screen"
              width={350}
              height={120}
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
        <div className={styles.mainScreenContainer}>
          <Image
            src="/images/logo3.png"
            alt="V-Check Logo"
            width={200}
            height={50}
            style={{ objectFit: 'contain' }}
            className={styles.mainScreenLogoTop}
          />
          <div className={styles.mainButtonsContainer}>
            <div role="button" tabIndex={0} className={styles.imageWrapper} onClick={() => router.push('/userLogin')} onKeyDown={(e) => e.key === 'Enter' && router.push('/userLogin')}>
              <Image src="/images/personal.png" alt="개인용" width={180} height={220} />
            </div>
            <div role="button" tabIndex={0} className={styles.imageWrapper} onClick={() => router.push('/adminLogin')} onKeyDown={(e) => e.key === 'Enter' && router.push('/adminLogin')}>
              <Image src="/images/group.png" alt="단체용" width={180} height={220} />
            </div>
          </div>
          <Image
            src="/images/logo2.png"
            alt="HealthyMed Logo"
            width={180}
            height={40}
            style={{ objectFit: 'contain' }}
            className={styles.mainScreenLogoBottom}
          />
        </div>
      )}
    </div>
  );
}