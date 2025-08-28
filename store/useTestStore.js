// store/useTestStore.js
import { create } from 'zustand';

const useTestStore = create((set) => ({
  testType: '', // 'urine' 또는 'saliva' 값을 가질 상태
  setTestType: (type) => set({ testType: type }),
  userInfo: null, // 사용자 정보를 저장할 상태
  setUserInfo: (userInfo) => set({ userInfo }),
  frontImage: null, // 앞면 이미지 데이터
  setFrontImage: (image) => set({ frontImage: image }),
  backImage: null, // 뒷면 이미지 데이터
  setBackImage: (image) => set({ backImage: image }),
  resetStore: () => set({
    testType: '',
    userInfo: null,
    frontImage: null,
    backImage: null
  }), // 스토어 초기화 함수
}));

export default useTestStore;