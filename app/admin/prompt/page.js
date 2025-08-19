// app/admin/prompt/page.js
'use client';

import { useState, useEffect } from 'react';
import styles from './prompt.module.css';
import { db } from '../../../lib/firebase/clientApp';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const kitData = {
  urine: [
    { id: 1, name: 'V-CHECK(6)' },
    { id: 3, name: 'V-CHECK(13)' },
  ],
  saliva: [
    { id: 1, name: 'V-CHECK(6)' },
    { id: 2, name: 'V-CHECK(12)' },
  ],
};

const defaultPrompts = {
    'urine-1': "Urine Kit 1: If two lines are displayed in the test part of the image, -1, if one line is displayed only in C, 1, and in all other cases, 0. Create an array equal to the number of test parts and return it. Just return an array only. no explanation, no text, no other characters, just an array. The image is as follows:",
    'urine-3': "Urine Kit 3: If two lines are displayed in the test part of the image, -1, if one line is displayed only in C, 1, and in all other cases, 0. Create an array equal to the number of test parts and return it. Just return an array only. no explanation, no text, no other characters, just an array. The image is as follows:",
    'saliva-1': "Saliva Kit 1: If two lines are displayed in the test part of the image, -1, if one line is displayed only in C, 1, and in all other cases, 0. Create an array equal to the number of test parts and return it. Just return an array only. no explanation, no text, no other characters, just an array. The image is as follows:",
    'saliva-2': "Saliva Kit 2: If two lines are displayed in the test part of the image, -1, if one line is displayed only in C, 1, and in all other cases, 0. Create an array equal to the number of test parts and return it. Just return an array only. no explanation, no text, no other characters, just an array. The image is as follows:",
};

export default function PromptPage() {
  const [activeTab, setActiveTab] = useState('urine');
  const [selectedKit, setSelectedKit] = useState(kitData.urine[0].id);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      setLoading(true);
      const promptId = `${activeTab}-${selectedKit}`;
      try {
        const docRef = doc(db, 'prompts', promptId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPrompt(docSnap.data().text);
        } else {
          setPrompt(defaultPrompts[promptId] || '');
        }
      } catch (error) {
        console.error("프롬프트 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrompt();
  }, [activeTab, selectedKit]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSelectedKit(kitData[tab][0].id);
  };

  const handleSave = async () => {
    setSaving(true);
    const promptId = `${activeTab}-${selectedKit}`;
    try {
      const docRef = doc(db, 'prompts', promptId);
      await setDoc(docRef, { text: prompt });
      alert('프롬프트가 저장되었습니다.');
    } catch (error) {
      console.error("프롬프트 저장 실패:", error);
      alert('프롬프트 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>프롬프트 관리</h1>

      <div className={styles.tabs}>
        <div className={`${styles.tab} ${activeTab === 'urine' ? styles.active : ''}`} onClick={() => handleTabClick('urine')}>
          소변 검사
        </div>
        <div className={`${styles.tab} ${activeTab === 'saliva' ? styles.active : ''}`} onClick={() => handleTabClick('saliva')}>
          타액 검사
        </div>
      </div>

      <div className={styles.kitSelector}>
        <label htmlFor="kit-select">키트 선택:</label>
        <select id="kit-select" value={selectedKit} onChange={(e) => setSelectedKit(Number(e.target.value))}>
          {kitData[activeTab].map(kit => (
            <option key={kit.id} value={kit.id}>{kit.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}