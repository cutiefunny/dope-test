'use client';

import { useState, useEffect } from 'react';
import styles from './adminLogin.module.css'; // adminLogin 고유 스타일
import commonStyles from '../common.module.css'; // [수정] 공통 스타일 임포트
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase/clientApp';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // [추가] 로그인 성공 모달
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.providerData.length > 0 && user.providerData[0].providerId === 'password') {
          console.log("관리자 로그인 성공, UID:", user.uid);
          router.push('/home');
        } else {
          console.log("이메일/비밀번호로 인증되지 않은 사용자입니다. 로그아웃 처리합니다.");
          auth.signOut();
        }
      } else {
        console.log("관리자 로그인 상태 아님.");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

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
      // 로그인 성공 시 onAuthStateChanged 리스너가 호출되어 모달을 띄웁니다.
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

  // [추가] 성공 모달 확인 버튼 핸들러
  const handleSuccessModalConfirm = () => {
    setShowSuccessModal(false);
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
      {/* 뒤로가기 버튼 및 타이틀 */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={commonStyles.backButton}>{backIcon()}</button>
        <h2 className={styles.headerTitle}>관리자 로그인</h2>
      </div>

      {/* 로그인 폼 */}
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

      {/* 로그인 버튼 */}
      <button
        onClick={handleLogin}
        className={commonStyles.bottomButton}
      >
        로그인
      </button>

      {/* 오류 모달 */}
      {showErrorModal && (
        <div className={commonStyles.modalOverlay}>
          <div className={commonStyles.modalContent}>
            <p className={commonStyles.modalMessage}>{errorMessage}</p>
            <button onClick={() => setShowErrorModal(false)} className={commonStyles.modalButton}>확인</button>
          </div>
        </div>
      )}

      {/* [추가] 로그인 성공 모달 */}
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
