// app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase/clientApp';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export default function AdminRootPageAsLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // 이미 관리자로 로그인 되어 있다면 바로 사용자 관리 페이지로 이동
      if (user && user.providerData.some(p => p.providerId === 'password')) {
        router.replace('/admin/users');
      } else {
        setLoading(false); // 로그인 되어 있지 않으면 로딩 종료하고 로그인 폼 표시
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 성공 시 useEffect의 onAuthStateChanged가 리디렉션을 처리합니다.
    } catch (error) {
      setErrorMessage('아이디 또는 비밀번호가 올바르지 않습니다.');
      console.error("로그인 에러:", error);
    }
  };
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>인증 상태를 확인 중입니다...</div>;
  }

  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.loginLogo}>LOGO</h1>
      <div className={styles.loginForm}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="아이디"
          className={styles.loginInput}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="비밀번호"
          className={styles.loginInput}
        />
         {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        <button onClick={handleLogin} className={styles.loginButton}>
          로그인
        </button>
      </div>
    </div>
  );
}