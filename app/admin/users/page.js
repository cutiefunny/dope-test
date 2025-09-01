'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './users.module.css';
import { db } from '../../../lib/firebase/clientApp';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Image from 'next/image';

export default function UsersPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        const q = query(collection(db, "testResults"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const resultsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          let summary = '음성';
          if (data.testResult && Array.isArray(data.testResult) && data.testResult.length > 0) {
            const isAllInvalid = data.testResult.every(r => r.result === '무효');
            if (isAllInvalid) {
              summary = '무효';
            } else {
              const hasPositive = data.testResult.some(r => r.result === '양성');
              if (hasPositive) {
                summary = '양성';
              }
            }
          }
          return {
            id: doc.id,
            ...data,
            registrationDate: data.createdAt?.toDate().toLocaleDateString('ko-KR') || 'N/A',
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
    const results = testResults.filter(result =>
      (result.name && result.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (result.phoneNumber && result.phoneNumber.includes(searchTerm))
    );
    setFilteredResults(results);
    setCurrentPage(1);
  }, [searchTerm, testResults]);

  const handleViewDetails = (result) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  const handleImageClick = (src) => {
    setImageModalSrc(src);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setImageModalSrc(null);
  };
  
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentResults = filteredResults.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredResults.length / usersPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 10;
    const pageGroup = Math.ceil(currentPage / maxPageButtons);
    let startPage = (pageGroup - 1) * maxPageButtons + 1;
    let endPage = Math.min(startPage + maxPageButtons - 1, totalPages);
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers.map(number => (
      <button key={number} onClick={() => paginate(number)} className={currentPage === number ? styles.activePage : ''}>
        {number}
      </button>
    ));
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
              <td style={{ 
                color: result.summaryResult === '양성' 
                  ? 'red' 
                  : result.summaryResult === '무효' 
                  ? 'gray' 
                  : 'blue' 
              }}>
                {result.summaryResult}
              </td>
              <td>{result.testType}</td>
              <td>{result.registrationDate}</td>
              <td><button onClick={() => handleViewDetails(result)} className={styles.viewButton}>보기</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>&lt;</button>
        {renderPageNumbers()}
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
                <div className={styles.imageContainer}>
                  {selectedResult.capturedImage ? (
                    <Image 
                      src={selectedResult.capturedImage}
                      alt="촬영된 키트 이미지 (앞면)"
                      width={150}
                      height={150}
                      className={styles.uploadedImage}
                      style={{ objectFit: 'contain', cursor: 'pointer' }}
                      onClick={() => handleImageClick(selectedResult.capturedImage)}
                    />
                  ) : (
                    <div className={styles.imageUpload}>+</div>
                  )}
                  {selectedResult.capturedImageBack && (
                     <Image 
                      src={selectedResult.capturedImageBack}
                      alt="촬영된 키트 이미지 (뒷면)"
                      width={150}
                      height={150}
                      className={styles.uploadedImage}
                      style={{ objectFit: 'contain', cursor: 'pointer' }}
                      onClick={() => handleImageClick(selectedResult.capturedImageBack)}
                    />
                  )}
                </div>
                <div className={styles.detailRow}><label>생년월일</label><input type="text" readOnly defaultValue={selectedResult.dob} /></div>
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

      {isImageModalOpen && imageModalSrc && (
        <div className={styles.imageModalOverlay} onClick={handleCloseImageModal}>
            <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
                <button onClick={handleCloseImageModal} className={styles.imageModalCloseButton}>×</button>
                <img src={imageModalSrc} alt="확대된 이미지" className={styles.imageModal} />
            </div>
        </div>
      )}
    </div>
  );
}

