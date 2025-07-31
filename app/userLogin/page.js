'use client';

import { useState, useEffect } from 'react';
import styles from './userLogin.module.css'; // CSS Modules 임포트
import { useRouter } from 'next/navigation'; // Next.js 13+ App Router에서 useRouter 사용
import { db, auth } from '../../lib/firebase/clientApp'; // Firebase 클라이언트 앱 임포트
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore'; // Firestore 함수 임포트
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'; // Firebase Auth 함수 임포트

export default function UserLoginPage() {
  const [step, setStep] = useState(1); // 1: 약관 동의, 2: 회원 정보 입력, 3: 인증 완료 모달
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacyCollection: false,
    privacyThirdParty: false,
  });
  const [userInfo, setUserInfo] = useState({
    name: '',
    dob: '',
    gender: '',
    region: '',
    phoneNumber: '',
    verificationCode: '',
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false); // 인증 완료 모달 표시 여부
  const [isVerificationRequested, setIsVerificationRequested] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isVerificationSuccess, setIsVerificationSuccess] = useState(false);

  const [verificationTimer, setVerificationTimer] = useState(180); // 3분 타이머 (초 단위)
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase 사용자 상태
  const [userId, setUserId] = useState(null); // Firestore 문서 ID로 사용할 userId

  const router = useRouter();

  // 뒤로가기 아이콘 컴포넌트
  const backIcon = () => (
    <img src="/images/back.png" alt="Back" style={{ width: '8px', height: '15px', marginLeft: '0.5rem' }} />
  );

  // Firebase 초기화 및 인증 상태 리스너 설정
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Canvas 환경에서 제공되는 초기 인증 토큰 사용
        // __initial_auth_token이 없으면 익명 로그인 시도
        if (typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined') {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase 인증 실패:", error);
        // 사용자에게 오류 메시지 표시
        setVerificationMessage('Firebase 인증에 실패했습니다. 앱을 다시 시작해주세요.');
        setIsVerificationSuccess(false);
      }
    };

    // 인증 상태 변경 감지
    // const unsubscribe = onAuthStateChanged(auth, (user) => {
    //   if (user) {
    //     setFirebaseUser(user);
    //     setUserId(user.uid); // 사용자 UID를 userId로 설정
    //     console.log("Firebase User UID:", user.uid);
    //   } else {
    //     setFirebaseUser(null);
    //     setUserId(null);
    //     console.log("No Firebase user is signed in.");
    //   }
    // });

    initializeFirebase(); // Firebase 초기화 및 인증 시도

    return () => {
      // unsubscribe(); // 컴포넌트 언마운트 시 리스너 해제
      if (timerIntervalId) clearInterval(timerIntervalId); // 타이머 클리어
    };
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 약관 동의 핸들러
  const handleAgreementChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'all') {
      setAgreements({
        all: checked,
        terms: checked,
        privacyCollection: checked,
        privacyThirdParty: checked,
      });
    } else {
      setAgreements((prev) => {
        const newAgreements = { ...prev, [name]: checked };
        const allChecked = newAgreements.terms && newAgreements.privacyCollection && newAgreements.privacyThirdParty;
        return { ...newAgreements, all: allChecked };
      });
    }
  };

  // 모든 필수 약관 동의 여부 확인
  const areAllRequiredAgreed = agreements.terms && agreements.privacyCollection && agreements.privacyThirdParty;

  // 회원 정보 입력 핸들러
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  // 인증 요청 버튼 클릭 핸들러
  const handleVerificationRequest = () => {
    if (!userInfo.phoneNumber) {
      setVerificationMessage('전화번호를 입력해주세요.');
      setIsVerificationSuccess(false);
      return;
    }

    console.log('인증 요청:', userInfo.phoneNumber);
    setIsVerificationRequested(true);
    setVerificationTimer(180); // 타이머 초기화
    if (timerIntervalId) clearInterval(timerIntervalId); // 기존 타이머 클리어
    setVerificationMessage('');
    setIsVerificationSuccess(false);

    const id = setInterval(() => {
      setVerificationTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setIsVerificationRequested(false); // 타이머 종료 시 인증 요청 상태 해제
          setVerificationMessage('인증 시간이 초과되었습니다. 다시 요청해주세요.');
          setIsVerificationSuccess(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerIntervalId(id);

    // 실제 SMS 발송 API 호출 (예시)
    // 이 부분은 useSmsMessage 훅을 사용하거나 직접 API를 호출하도록 구현해야 합니다.
    // 현재는 더미 로직으로 대체합니다.
    // sendSmsMessage({ phone: userInfo.phoneNumber, message: "인증번호: 123456" });
    setVerificationMessage('인증번호가 발송되었습니다.');
    setIsVerificationSuccess(true);
  };

  // 인증번호 확인 버튼 클릭 핸들러
  const handleVerificationConfirm = () => {
    console.log('인증번호 확인:', userInfo.verificationCode);
    // 예시: 실제로는 서버에서 인증번호 확인 로직을 구현해야 합니다.
    if (userInfo.verificationCode === '123456') { // 예시: 실제로는 서버에서 확인
      clearInterval(timerIntervalId); // 타이머 중지
      setVerificationMessage('본인인증이 완료되었습니다.');
      setIsVerificationSuccess(true);
      setVerificationDone(true); // 인증 완료 상태로 변경
    } else {
      setVerificationMessage('인증번호가 올바르지 않습니다.');
      setIsVerificationSuccess(false);
      setVerificationDone(false); // 인증 실패 시 완료 버튼 비활성화
    }
  };

  // 완료 버튼 클릭 핸들러
  const handleComplete = async () => {
    if (!verificationDone) {
      setVerificationMessage('전화번호 인증을 완료해야 합니다.');
      setIsVerificationSuccess(false);
      return;
    }
    // if (!userId) {
    //   setVerificationMessage('사용자 인증 정보를 가져올 수 없습니다. 다시 시도해주세요.');
    //   setIsVerificationSuccess(false);
    //   console.error("Firebase User ID is not available.");
    //   return;
    // }

    try {
      const usersCollectionRef = collection(db, 'users');
      // name과 dob가 일치하는 기존 문서가 있는지 쿼리
      const q = query(usersCollectionRef, 
                      where('name', '==', userInfo.name), 
                      where('dob', '==', userInfo.dob));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 일치하는 문서가 있다면 첫 번째 문서를 업데이트
        const existingDoc = querySnapshot.docs[0];
        const userDocRef = doc(db, 'users', existingDoc.id); // 쿼리 결과로 찾은 문서의 ID 사용
        await updateDoc(userDocRef, {
          gender: userInfo.gender,
          region: userInfo.region,
          phoneNumber: userInfo.phoneNumber,
          updatedAt: new Date(), // 업데이트 시간 기록
        });
        console.log('기존 사용자 정보 업데이트 성공 (name, dob 기준):', userInfo);
        setVerificationMessage('기존 사용자 정보가 성공적으로 업데이트되었습니다.');
      } else {
        // 일치하는 문서가 없다면 새로운 문서 생성 
        const newUserDocRef = doc(usersCollectionRef); // 새로운 문서 ID 생성
        await setDoc(newUserDocRef, {
          name: userInfo.name,
          dob: userInfo.dob,
          gender: userInfo.gender,
          region: userInfo.region,
          phoneNumber: userInfo.phoneNumber,
          createdAt: new Date(), // 생성 시간 기록
        });
        console.log('새로운 사용자 정보 저장 성공 :', userInfo);
        setVerificationMessage('회원가입 및 본인인증이 성공적으로 완료되었습니다.');
      }
      
      setIsVerificationSuccess(true);
      // 성공적으로 저장/업데이트되면 모달을 띄웁니다.
      setShowVerificationModal(true);
    } catch (error) {
      console.error('Firestore에 사용자 정보 저장/업데이트 실패:', error);
      setVerificationMessage('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsVerificationSuccess(false);
    }
  };

  // 모달 확인 버튼 클릭 핸들러
  const handleModalConfirm = () => {
    setShowVerificationModal(false); // 모달 닫기
    router.push('/'); // 메인 화면으로 이동
  };

  // 타이머 형식 변환
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      {/* 뒤로가기 버튼 및 타이틀 (모든 단계에 공통) */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>{backIcon()}</button>
        <h2 className={styles.headerTitle}>회원인증</h2>
      </div>

      {/* 약관 동의 단계 */}
      {step === 1 && (
        <div className={styles.contentArea}>
          <div className={styles.agreementSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="all"
                checked={agreements.all}
                onChange={handleAgreementChange}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxCustom}></span>
              전체 동의
            </label>
            <div className={styles.divider}></div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="terms"
                checked={agreements.terms}
                onChange={handleAgreementChange}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxCustom}></span>
              (필수) 서비스 이용 약관
              <span className={styles.arrowIcon}><img src="/images/right.png" alt="right" /></span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="privacyCollection"
                checked={agreements.privacyCollection}
                onChange={handleAgreementChange}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxCustom}></span>
              (필수) 개인정보 수집 및 처리 방침
              <span className={styles.arrowIcon}><img src="/images/right.png" alt="right" /></span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="privacyThirdParty"
                checked={agreements.privacyThirdParty}
                onChange={handleAgreementChange}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxCustom}></span>
              (필수) 개인정보 제3자 제공 동의
              <span className={styles.arrowIcon}><img src="/images/right.png" alt="right" /></span>
            </label>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!areAllRequiredAgreed}
            className={`${styles.bottomButton} ${!areAllRequiredAgreed ? styles.disabledButton : ''}`}
          >
            다음
          </button>
        </div>
      )}

      {/* 회원 정보 입력 및 전화번호 인증 단계 */}
      {step === 2 && (
        <div className={styles.contentArea}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.inputLabel}>이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={userInfo.name}
              onChange={handleUserInfoChange}
              placeholder="홍길동"
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="dob" className={styles.inputLabel}>생년월일</label>
            <input
              type="text"
              id="dob"
              name="dob"
              value={userInfo.dob}
              onChange={handleUserInfoChange}
              placeholder="YYYYMMDD"
              className={styles.inputField}
            />
          </div>

          <div className={styles.rowGroup}>
            <div className={styles.inputGroupHalf}>
              <label htmlFor="gender" className={styles.inputLabel}>성별</label>
              <select
                id="gender"
                name="gender"
                value={userInfo.gender}
                onChange={handleUserInfoChange}
                className={styles.selectField}
              >
                <option value="">선택</option>
                <option value="male">남자</option>
                <option value="female">여자</option>
              </select>
            </div>
            <div className={styles.inputGroupHalf}>
              <label htmlFor="region" className={styles.inputLabel}>지역</label>
              <select
                id="region"
                name="region"
                value={userInfo.region}
                onChange={handleUserInfoChange}
                className={styles.selectField}
              >
                <option value="">지역을 선택하세요</option>
                <option value="서울">서울</option>
                <option value="경기">경기</option>
                <option value="충북">충북</option>
                <option value="충남">충남</option>
                <option value="강원">강원</option>
                <option value="전북">전북</option>
                <option value="전남">전남</option>
                <option value="경북">경북</option>
                <option value="경남">경남</option>
                <option value="제주">제주</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phoneNumber" className={styles.inputLabel}>전화번호</label>
            <div className={styles.phoneInputContainer}>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={userInfo.phoneNumber}
                onChange={handleUserInfoChange}
                placeholder="01012345678"
                className={styles.inputField}
              />
              <button
                onClick={handleVerificationRequest}
                className={styles.verificationRequestButton}
                disabled={isVerificationRequested && verificationTimer > 0}
              >
                {isVerificationRequested && verificationTimer > 0 ? '재전송' : '인증요청'}
              </button>
            </div>
          </div>

          {isVerificationRequested && (
            <div className={styles.inputGroup}>
              <div className={styles.verificationInputContainer}>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  value={userInfo.verificationCode}
                  onChange={handleUserInfoChange}
                  placeholder="인증번호를 입력해주세요"
                  className={`${styles.inputField} ${!isVerificationSuccess ? styles.inputFieldWrong : ''}`}
                />
                <span className={styles.timer}>{formatTime(verificationTimer)}</span>
                <button
                  onClick={handleVerificationConfirm}
                  className={styles.verificationConfirmButton}
                >
                  확인
                </button>
              </div>
              {/* 인증 메시지 표시 */}
              {verificationMessage && (
                <p className={isVerificationSuccess ? styles.successMessage : styles.errorMessage}>
                  {verificationMessage}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleComplete}
            className={`${styles.bottomButton} ${!verificationDone ? styles.disabledButton : ''}`}
            disabled={!verificationDone} // 인증 완료 시에만 활성화
          >
            완료
          </button>
        </div>
      )}

      {/* 인증 완료 모달 */}
      {showVerificationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <p className={styles.modalMessage}>본인인증이 완료되었습니다!</p>
            <button onClick={handleModalConfirm} className={styles.modalButton}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
