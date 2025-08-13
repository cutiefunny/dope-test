// app/admin/prompt/page.js
'use client';

import { useState, useEffect } from 'react';
import styles from './prompt.module.css';
import { db } from '../../../lib/firebase/clientApp';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function PromptPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const docRef = doc(db, 'settings', 'prompt');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPrompt(docSnap.data().text);
        } else {
          // 기본 프롬프트 설정
          setPrompt("If two lines are displayed in the test part of the image, -1, if one line is displayed only in C, 1, and in all other cases, 0. Create an array equal to the number of test parts and return it. Just return an array only. no explanation, no text, no other characters, just an array. The image is as follows:");
        }
      } catch (error) {
        console.error("프롬프트 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrompt();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'prompt');
      await setDoc(docRef, { text: prompt });
      alert('프롬프트가 저장되었습니다.');
    } catch (error) {
      console.error("프롬프트 저장 실패:", error);
      alert('프롬프트 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>프롬프트 관리</h1>
      <textarea
        className={styles.promptTextarea}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows="10"
      />
      <button
        className={styles.saveButton}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}