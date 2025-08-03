// app/admin/users/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './users.module.css';
import { db } from '../../../lib/firebase/clientApp';
import { collection, getDocs } from "firebase/firestore";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Firestore 타임스탬프를 문자열로 변환
          registrationDate: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || 'N/A'
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error("사용자 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
  useEffect(() => {
    const results = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm)
    );
    setFilteredUsers(results);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  }, [searchTerm, users]);


  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };
  
  // 페이지네이션 관련
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
            <th>키트번호</th>
            <th>등록일</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, index) => (
            <tr key={user.id}>
              <td>{indexOfFirstUser + index + 1}</td>
              <td>{user.name}</td>
              <td>{user.phoneNumber}</td>
              <td>{user.gender === 'male' ? '남자' : '여자'}</td>
              <td>{user.region}</td>
              <td>{user.testResult || 'N/A'}</td>
              <td>{user.testType || 'N/A'}</td>
              <td>{user.registrationDate}</td>
              <td><button onClick={() => handleViewDetails(user)} className={styles.viewButton}>보기</button></td>
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

      {isModalOpen && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button onClick={handleCloseModal} className={styles.closeButton}>×</button>
            <div className={styles.modalBody}>
              <div className={styles.leftPanel}>
                <div className={styles.detailRow}><label>No.</label><span>{selectedUser.id.slice(0, 6)}</span></div>
                <div className={styles.detailRow}><label>검사일시</label><input type="text" defaultValue={new Date().toLocaleString('ko-KR')} /></div>
                <div className={styles.detailRow}><label>이름</label><input type="text" defaultValue={selectedUser.name} /></div>
                <div className={styles.detailRow}><label>전화번호</label><input type="text" defaultValue={selectedUser.phoneNumber} /></div>
                <div className={styles.detailRow}><label>성별</label><input type="text" defaultValue={selectedUser.gender === 'male' ? '남자' : '여자'} /></div>
                <div className={styles.detailRow}><label>지역</label><input type="text" defaultValue={selectedUser.region} /></div>
                <div className={styles.detailRow}><label>키트번호</label><input type="text" defaultValue={selectedUser.testType || 'N/A'} /></div>
                <div className={styles.detailRow}>
                  <label>개인/단체</label>
                  <select defaultValue="individual">
                    <option value="individual">개인</option>
                    <option value="group">단체(관리자)</option>
                  </select>
                </div>
              </div>
              <div className={styles.rightPanel}>
                <div className={styles.imageUpload}>+</div>
                <div className={styles.detailRow}><label>생년월일</label><input type="text" defaultValue={selectedUser.dob} /></div>
                <div className={styles.detailRow}><label>검사결과</label><input type="text" defaultValue={selectedUser.testResult || '음성'} className={styles.resultInput} /></div>
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