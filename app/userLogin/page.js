'use client';

import { useState, useEffect } from 'react';
import styles from './userLogin.module.css'; // CSS Modules 임포트
import { useRouter } from 'next/navigation'; // Next.js 13+ App Router에서 useRouter 사용

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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerificationRequested, setIsVerificationRequested] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);
  const [verificationAlert, setVerificationAlert] = useState(false);
  const [verificationTimer, setVerificationTimer] = useState(180); // 3분 타이머 (초 단위)
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const backIcon = () => (
    <img src="/images/back.png" alt="Back" style={{ width: '8px', height: '15px', marginLeft: '0.5rem' }} />
  );

  const router = useRouter();

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
    // 실제 인증 요청 로직 (API 호출 등)
    console.log('인증 요청:', userInfo.phoneNumber);
    setIsVerificationRequested(true);
    setVerificationTimer(180); // 타이머 초기화
    if (timerIntervalId) clearInterval(timerIntervalId); // 기존 타이머 클리어

    const id = setInterval(() => {
      setVerificationTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setIsVerificationRequested(false); // 타이머 종료 시 인증 요청 상태 해제
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerIntervalId(id);
  };

  // 인증번호 확인 버튼 클릭 핸들러
  const handleVerificationConfirm = () => {
    // 실제 인증번호 확인 로직 (API 호출 등)
    console.log('인증번호 확인:', userInfo.verificationCode);
    // 인증 성공 시 모달 표시
    if (userInfo.verificationCode === '123456') { // 예시: 실제로는 서버에서 확인
      clearInterval(timerIntervalId); // 타이머 중지
      setShowVerificationModal(true);
    } else {
      alert('인증번호가 올바르지 않습니다.'); // 실제 앱에서는 커스텀 모달 사용 권장
    }
  };

  // 인증 완료 모달 확인 버튼 클릭 핸들러
  const handleModalConfirm = () => {
    setShowVerificationModal(false);
    setVerificationDone(true); // 인증 완료 상태로 변경
    // 다음 단계로 이동하거나 (예: 회원가입 완료)
    // 여기서는 일단 '완료' 버튼이 활성화되도록 상태를 유지
  };

  // 완료 버튼 클릭 핸들러
  const handleComplete = () => {
    // 최종 회원가입 완료 로직
    console.log('회원인증 완료:', userInfo);
    alert('회원인증이 완료되었습니다!'); // 실제 앱에서는 커스텀 모달 사용 권장
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
                  className={styles.inputField}
                />
                <span className={styles.timer}>{formatTime(verificationTimer)}</span>
                <button
                  onClick={handleVerificationConfirm}
                  className={styles.verificationConfirmButton}
                >
                  확인
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleComplete}
            className={`${styles.bottomButton} ${!verificationDone ? styles.disabledButton : ''}`}
            disabled={!verificationDone} // 인증 완료 모달이 뜬 후에만 활성화
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
