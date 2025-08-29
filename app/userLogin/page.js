'use client';

import { useState, useEffect } from 'react';
import styles from './userLogin.module.css';
import { useRouter } from 'next/navigation';
import { db, auth } from '../../lib/firebase/clientApp';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import useSmsMessage from '../../hooks/useSmsMessage';
import useTestStore from '../../store/useTestStore'; // Zustand 스토어 import

export default function UserLoginPage() {
  const [step, setStep] = useState(1);
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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerificationRequested, setIsVerificationRequested] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isVerificationSuccess, setIsVerificationSuccess] = useState(false);
  const [generatedVerificationCode, setGeneratedVerificationCode] = useState('');
  const [verificationTimer, setVerificationTimer] = useState(180);
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userId, setUserId] = useState(null);

  const router = useRouter();
  const { sendSmsMessage, loading: smsLoading, error: smsError } = useSmsMessage();
  const testType = useTestStore((state) => state.testType); // Zustand 스토어에서 testType 가져오기

  // 뒤로가기 아이콘 컴포넌트
  const backIcon = () => (
    <img src="/images/back.png" alt="Back" style={{ width: '8px', height: '15px', marginLeft: '0.5rem' }} />
  );

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        if (typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined') {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase 인증 실패:", error);
        setVerificationMessage('Firebase 인증에 실패했습니다. 앱을 다시 시작해주세요.');
        setIsVerificationSuccess(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setUserId(user.uid);
        console.log("Firebase User UID:", user.uid);
      } else {
        setFirebaseUser(null);
        setUserId(null);
        console.log("No Firebase user is signed in.");
      }
    });

    initializeFirebase();

    return () => {
      unsubscribe();
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, []);

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

  const areAllRequiredAgreed = agreements.terms && agreements.privacyCollection && agreements.privacyThirdParty;

  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerificationRequest = async () => {
    if (!userInfo.phoneNumber) {
      setVerificationMessage('전화번호를 입력해주세요.');
      setIsVerificationSuccess(false);
      return;
    }
    
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedVerificationCode(randomCode);
    console.log('생성된 인증번호:', randomCode);

    setVerificationMessage('인증번호를 발송 중입니다...');
    setIsVerificationSuccess(true);
    setIsVerificationRequested(true);

    const messageContent = `[마약검사앱] 본인확인 인증번호는 [${randomCode}]입니다.`;
    const result = await sendSmsMessage({
      name: userInfo.name,
      phone: userInfo.phoneNumber,
      message: messageContent,
    });

    if (result && result.success) {
      setVerificationMessage('인증번호가 발송되었습니다.');
      setIsVerificationSuccess(true);
      setVerificationTimer(180);
      if (timerIntervalId) clearInterval(timerIntervalId);
      const id = setInterval(() => {
        setVerificationTimer((prev) => {
          if (prev <= 1) {
            clearInterval(id);
            setIsVerificationRequested(false);
            setVerificationMessage('인증 시간이 초과되었습니다. 다시 요청해주세요.');
            setIsVerificationSuccess(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerIntervalId(id);
    } else {
      setVerificationMessage(smsError || '인증번호 발송에 실패했습니다. 다시 시도해주세요.');
      setIsVerificationSuccess(false);
      setIsVerificationRequested(false);
    }
  };

  const handleVerificationConfirm = () => {
    console.log('인증번호 확인:', userInfo.verificationCode);
    if (userInfo.verificationCode === generatedVerificationCode) {
      clearInterval(timerIntervalId);
      setVerificationMessage('본인인증이 완료되었습니다.');
      setIsVerificationSuccess(true);
      setVerificationDone(true);
    } else {
      setVerificationMessage('인증번호가 올바르지 않습니다.');
      setIsVerificationSuccess(false);
      setVerificationDone(false);
    }
  };

  const handleComplete = async () => {
    // 관리자 페이지에서 진입한 경우가 아니면서, SMS 인증이 완료되지 않았을 때
    if (!testType && !verificationDone) {
      setVerificationMessage('전화번호 인증을 완료해야 합니다.');
      setIsVerificationSuccess(false);
      return;
    }
    setShowVerificationModal(true);
  };

  const handleModalConfirm = () => {
    setShowVerificationModal(false);
    // zustand 스토어에 인증 된 사용자 정보를 저장한 뒤 테스트 유형에 따라 테스트 페이지로 이동
    useTestStore.getState().setUserInfo(userInfo);
    if (testType) {
      router.push(`/test/${testType}`); // 테스트 페이지로 이동
    } else {
      router.push('/home'); // 홈 페이지로 이동
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 모든 필드가 채워졌는지 확인 (관리자용)
  const isAdminFormComplete = userInfo.name && userInfo.dob && userInfo.phoneNumber && userInfo.gender && userInfo.region;
  // 모든 필드 + SMS 인증이 완료되었는지 확인 (개인용)
  const isUserFormComplete = isAdminFormComplete && verificationDone;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>{backIcon()}</button>
        <h2 className={styles.headerTitle}>{!testType ? '회원인증' : '사용자 인증'}</h2>
      </div>

      {step === 1 && !testType && (
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

      {step === 2 && !testType && (
        <div className={styles.contentArea}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.inputLabel}>이름</label>
            <input type="text" id="name" name="name" value={userInfo.name} onChange={handleUserInfoChange} placeholder="이름을 입력해주세요." className={styles.inputField}/>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="dob" className={styles.inputLabel}>생년월일</label>
            <input type="text" id="dob" name="dob" value={userInfo.dob} onChange={handleUserInfoChange} placeholder="생년월일을 입력해주세요." className={styles.inputField}/>
          </div>
          <div className={styles.inputGroup}>
             <label htmlFor="phoneNumber" className={styles.inputLabel}>전화번호</label>
             <div className={styles.phoneInputContainer}>
               <input type="tel" id="phoneNumber" name="phoneNumber" value={userInfo.phoneNumber} onChange={handleUserInfoChange} placeholder="핸드폰 번호를 입력해주세요." className={styles.inputField}/>
               <button onClick={handleVerificationRequest} className={styles.verificationRequestButton} disabled={isVerificationRequested && verificationTimer > 0}>
                   {isVerificationRequested && verificationTimer > 0 ? '재전송' : '인증요청'}
               </button>
             </div>
          </div>
          {isVerificationRequested && (
            <div className={styles.inputGroup}>
              <div className={styles.verificationInputContainer}>
                <input type="text" id="verificationCode" name="verificationCode" value={userInfo.verificationCode} onChange={handleUserInfoChange} placeholder="인증번호를 입력해주세요" className={`${styles.inputField} ${!isVerificationSuccess ? styles.inputFieldWrong : ''}`}/>
                <span className={styles.timer}>{formatTime(verificationTimer)}</span>
                <button onClick={handleVerificationConfirm} className={styles.verificationConfirmButton}>확인</button>
              </div>
              {verificationMessage && (<p className={isVerificationSuccess ? styles.successMessage : styles.errorMessage}>{verificationMessage}</p>)}
            </div>
          )}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>성별</label>
            <div className={styles.genderButtonContainer}>
              <button
                type="button"
                className={`${styles.genderButton} ${userInfo.gender === 'male' ? styles.genderButtonActive : ''}`}
                onClick={() => setUserInfo((prev) => ({ ...prev, gender: 'male' }))}
              >
                남자
              </button>
              <button
                type="button"
                className={`${styles.genderButton} ${userInfo.gender === 'female' ? styles.genderButtonActive : ''}`}
                onClick={() => setUserInfo((prev) => ({ ...prev, gender: 'female' }))}
              >
                여자
              </button>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="region" className={styles.inputLabel}>지역</label>
            <select id="region" name="region" value={userInfo.region} onChange={handleUserInfoChange} className={styles.selectField}>
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
          <button onClick={handleComplete} className={`${styles.bottomButton} ${!isUserFormComplete ? styles.disabledButton : ''}`} disabled={!isUserFormComplete}>
            완료
          </button>
        </div>
      )}

      {step === 1 && testType && (
         <div className={styles.contentArea}>
          <p className={styles.pageSubtitle}>사용자 정보를 입력해주세요.</p>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.inputLabel}>이름</label>
            <input type="text" id="name" name="name" value={userInfo.name} onChange={handleUserInfoChange} placeholder="이름을 입력해주세요." className={styles.inputField}/>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="dob" className={styles.inputLabel}>생년월일</label>
            <input type="text" id="dob" name="dob" value={userInfo.dob} onChange={handleUserInfoChange} placeholder="생년월일을 입력해주세요." className={styles.inputField}/>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="phoneNumber" className={styles.inputLabel}>전화번호</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={userInfo.phoneNumber} onChange={handleUserInfoChange} placeholder="핸드폰 번호를 입력해주세요." className={styles.inputField}/>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>성별</label>
            <div className={styles.genderButtonContainer}>
              <button
                type="button"
                className={`${styles.genderButton} ${userInfo.gender === 'male' ? styles.genderButtonActive : ''}`}
                onClick={() => setUserInfo((prev) => ({ ...prev, gender: 'male' }))}
              >
                남자
              </button>
              <button
                type="button"
                className={`${styles.genderButton} ${userInfo.gender === 'female' ? styles.genderButtonActive : ''}`}
                onClick={() => setUserInfo((prev) => ({ ...prev, gender: 'female' }))}
              >
                여자
              </button>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="region" className={styles.inputLabel}>지역</label>
            <select id="region" name="region" value={userInfo.region} onChange={handleUserInfoChange} className={styles.selectField}>
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
          <button onClick={handleComplete} className={`${styles.bottomButton} ${!isAdminFormComplete ? styles.disabledButton : ''}`} disabled={!isAdminFormComplete}>
            완료
          </button>
        </div>
      )}

      {showVerificationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* --- ▼ 모달 텍스트 수정 ▼ --- */}
            <p className={styles.modalMessage}>사용자 인증이 완료되었습니다.</p>
            {/* --- ▲ 모달 텍스트 수정 ▲ --- */}
            <button onClick={handleModalConfirm} className={styles.modalButton}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}