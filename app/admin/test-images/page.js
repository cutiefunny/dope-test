// app/admin/test-images/page.js
'use client';

import Image from 'next/image';
import styles from './test-images.module.css';

const testImages = [
  '/images/dope-test1.jpg',
  '/images/dope-test2.jpg',
  '/images/dope-test3.jpg',
];

export default function TestImagesPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>테스트 이미지 갤러리</h1>
      <div className={styles.gallery}>
        {testImages.map((src, index) => (
          <div key={index} className={styles.imageContainer}>
            <Image
              src={src}
              alt={`Test Image ${index + 1}`}
              width={300}
              height={400}
              className={styles.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}