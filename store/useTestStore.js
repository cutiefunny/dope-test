// store/useTestStore.js
import { create } from 'zustand';

const useTestStore = create((set) => ({
  testType: '', // 'urine' 또는 'saliva' 값을 가질 상태
  setTestType: (type) => set({ testType: type }),
  setUserInfo: (userInfo) => set({ userInfo }), // 사용자 정보를 저장하는 함수
  userInfo: null, // 사용자 정보를 저장할 상태
  resetStore: () => set({ testType: '', userInfo: null }), // 스토어 초기화 함수
}));

export default useTestStore;