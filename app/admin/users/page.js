'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './users.module.css';
import { db } from '../../../lib/firebase/clientApp';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function UsersPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        // 'testResults' 컬렉션에서 데이터를 'createdAt' 필드 기준 내림차순으로 정렬하여 가져옵니다.
        const q = query(collection(db, "testResults"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const resultsData = querySnapshot.docs.map(doc => {
          const data = doc.data();

          // --- ⬇️ 요약 결과 로직 수정 ⬇️ ---
          let summary = '음성'; // 기본값
          if (data.testResult && Array.isArray(data.testResult) && data.testResult.length > 0) {
            // 모든 결과가 '무효'인지 확인
            const isAllInvalid = data.testResult.every(r => r.result === '무효');
            if (isAllInvalid) {
              summary = '무효';
            } else {
              // '양성'이 하나라도 있는지 확인
              const hasPositive = data.testResult.some(r => r.result === '양성');
              if (hasPositive) {
                summary = '양성';
              }
            }
          }
          // --- ⬆️ 요약 결과 로직 수정 ⬆️ ---
          
          return {
            id: doc.id,
            ...data,
            // Firestore 타임스탬프를 문자열로 변환합니다.
            registrationDate: data.createdAt?.toDate().toLocaleDateString('ko-KR') || 'N/A',
            // 요약된 검사 결과를 추가합니다.
            summaryResult: summary,
          };
        });
        setTestResults(resultsData);
        setFilteredResults(resultsData);
      } catch (error) {
        console.error("테스트 결과 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestResults();
  }, []);
  
  useEffect(() => {
    // 이름 또는 전화번호로 검색합니다.
    const results = testResults.filter(result =>
      (result.name && result.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (result.phoneNumber && result.phoneNumber.includes(searchTerm))
    );
    setFilteredResults(results);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  }, [searchTerm, testResults]);


  const handleViewDetails = (result) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };
  
  // 페이지네이션 관련
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentResults = filteredResults.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredResults.length / usersPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <input
          type="text"
          placeholder="검색 (이름 또는 전화번호를 입력해주세요)"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className={styles.adminInfo}>관리자님</div>
      </header>

      <table className={styles.userTable}>
        <thead>
          <tr>
            <th>NO</th>
            <th>이름</th>
            <th>전화번호</th>
            <th>성별</th>
            <th>지역</th>
            <th>검사결과</th>
            <th>키트종류</th>
            <th>등록일</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {currentResults.map((result, index) => (
            <tr key={result.id}>
              <td>{indexOfFirstUser + index + 1}</td>
              <td>{result.name}</td>
              <td>{result.phoneNumber}</td>
              <td>{result.gender === 'male' ? '남자' : '여자'}</td>
              <td>{result.region}</td>
              {/* --- ⬇️ 검사 결과 스타일 수정 ⬇️ --- */}
              <td style={{ 
                color: result.summaryResult === '양성' 
                  ? 'red' 
                  : result.summaryResult === '무효' 
                  ? 'gray' 
                  : 'blue' 
              }}>
                {result.summaryResult}
              </td>
              {/* --- ⬆️ 검사 결과 스타일 수정 ⬆️ --- */}
              <td>{result.testType}</td>
              <td>{result.registrationDate}</td>
              <td><button onClick={() => handleViewDetails(result)} className={styles.viewButton}>보기</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>&lt;</button>
        {[...Array(totalPages).keys()].map(number => (
          <button key={number + 1} onClick={() => paginate(number + 1)} className={currentPage === number + 1 ? styles.activePage : ''}>
            {number + 1}
          </button>
        ))}
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>&gt;</button>
      </div>

      {isModalOpen && selectedResult && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button onClick={handleCloseModal} className={styles.closeButton}>×</button>
            <div className={styles.modalBody}>
              <div className={styles.leftPanel}>
                <div className={styles.detailRow}><label>No.</label><span>{selectedResult.id.slice(0, 6)}</span></div>
                <div className={styles.detailRow}><label>검사일시</label><input type="text" readOnly defaultValue={selectedResult.registrationDate} /></div>
                <div className={styles.detailRow}><label>이름</label><input type="text" readOnly defaultValue={selectedResult.name} /></div>
                <div className={styles.detailRow}><label>전화번호</label><input type="text" readOnly defaultValue={selectedResult.phoneNumber} /></div>
                <div className={styles.detailRow}><label>성별</label><input type="text" readOnly defaultValue={selectedResult.gender === 'male' ? '남자' : '여자'} /></div>
                <div className={styles.detailRow}><label>지역</label><input type="text" readOnly defaultValue={selectedResult.region} /></div>
                <div className={styles.detailRow}><label>키트종류</label><input type="text" readOnly defaultValue={selectedResult.testType} /></div>
                <div className={styles.detailRow}><label>키트ID</label><input type="text" readOnly defaultValue={selectedResult.kitId} /></div>
              </div>
              <div className={styles.rightPanel}>
                <div className={styles.imageUpload}>+</div>
                <div className={styles.detailRow}><label>생년월일</label><input type="text" readOnly defaultValue={selectedResult.dob} /></div>
                {/* 상세 검사 결과를 모두 표시합니다. */}
                <div className={styles.detailRow}>
                    <label>검사결과</label>
                    <div className={styles.resultDetails}>
                        {selectedResult.testResult.map((res, index) => (
                            <div key={index} className={styles.resultChip} style={{ color: res.result === '양성' ? 'red' : 'inherit' }}>
                                <strong>{res.drug}:</strong> {res.result}
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.detailRow}>
                  <label>비고</label>
                  <textarea placeholder="해당 칸은 비고란 입니다."></textarea>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.editButton}>수정하기</button>
              <button className={styles.saveButton}>저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}