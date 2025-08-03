// app/admin/layout.js
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase/clientApp';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // /admin 페이지 자체는 인증 검사에서 제외 (로그인 페이지이므로)
      if (pathname === '/admin') {
        setLoading(false);
        return;
      }

      // /admin 하위 페이지에 접근 시, 관리자 로그인이 아니면 /admin으로 보냄
      if (!user || !user.providerData.some(p => p.providerId === 'password')) {
        router.replace('/admin');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);

  // /admin 경로(로그인 페이지)에서는 레이아웃 UI 없이 자식 컴포넌트만 렌더링
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  if (loading) {
    return <div className={styles.loadingContainer}>인증 상태를 확인 중입니다...</div>;
  }
  
  // 인증된 사용자에게만 사이드바가 포함된 레이아웃을 보여줌
  return (
    <div className={styles.layoutContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          LOGO
        </div>
        <nav className={styles.sidebarNav}>
          <a 
            href="/admin/users" 
            className={pathname.startsWith('/admin/users') ? styles.activeLink : ''}
          >
            사용자 관리
          </a>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}