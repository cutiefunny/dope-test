'use client';

import { useState, useEffect } from 'react';
import styles from './adminLogin.module.css';
import commonStyles from '../common.module.css';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase/clientApp';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    // 페이지 로드 시 로그인 상태만 확인하여 로딩 화면을 제어합니다.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const backIcon = () => (
    <img src="/images/back.png" alt="Back" style={{ width: '8px', height: '15px', marginLeft: '0.5rem' }} />
  );

  const handleLogin = async () => {
    setErrorMessage('');
    setShowErrorModal(false);

    if (!email || !password) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.');
      setShowErrorModal(true);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 로그인 성공 시, 성공 모달을 띄웁니다.
      setShowSuccessModal(true);
    } catch (error) {
      let message = '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = '잘못된 아이디 또는 비밀번호입니다.';
      } else if (error.code === 'auth/invalid-email') {
        message = '유효하지 않은 이메일 형식입니다.';
      } else {
        console.error("로그인 에러:", error);
      }
      setErrorMessage(message);
      setShowErrorModal(true);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  const handleSuccessModalConfirm = () => {
    setShowSuccessModal(false);
    // 성공 모달의 '확인' 버튼을 누르면 홈으로 이동합니다.
    router.push('/home');
  };

  if (loading) {
    return (
        <div className={styles.loadingContainer}>
            <p>로그인 상태 확인 중...</p>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={commonStyles.backButton}>{backIcon()}</button>
        <h2 className={styles.headerTitle}>관리자 로그인</h2>
      </div>

      <div className={styles.contentArea}>
        <div className={commonStyles.inputGroup}>
          <label htmlFor="email" className={commonStyles.inputLabel}>아이디</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="관리자 전용 아이디 ex)admin1"
            className={commonStyles.inputField}
          />
        </div>

        <div className={commonStyles.inputGroup}>
          <label htmlFor="password" className={commonStyles.inputLabel}>비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="관리자 전용 비밀번호"
            className={commonStyles.inputField}
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        className={commonStyles.bottomButton}
      >
        로그인
      </button>

      {showErrorModal && (
        <div className={commonStyles.modalOverlay}>
          <div className={commonStyles.modalContent}>
            <p className={commonStyles.modalMessage}>{errorMessage}</p>
            <button onClick={() => setShowErrorModal(false)} className={commonStyles.modalButton}>확인</button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className={commonStyles.modalOverlay}>
          <div className={commonStyles.modalContent}>
            <p className={commonStyles.modalMessage}>관리자님 어서오세요!</p>
            <button onClick={handleSuccessModalConfirm} className={commonStyles.modalButton}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}