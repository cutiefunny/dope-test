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
  
  // --- ▼ 재촬영 횟수 관련 상태 추가 ▼ ---
  retakeChances: 3, // 재촬영 기회
  decrementRetakeChances: () => set((state) => ({ 
    retakeChances: state.retakeChances > 0 ? state.retakeChances - 1 : 0 
  })),
  // --- ▲ 재촬영 횟수 관련 상태 추가 ▲ ---

  resetStore: () => set({
    testType: '',
    userInfo: null,
    frontImage: null,
    backImage: null,
    retakeChances: 3, // 스토어 초기화 시 재촬영 기회도 초기화
  }),
}));

export default useTestStore;