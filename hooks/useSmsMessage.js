// /hooks/useSmsMessage.js
'use client';

import { useState } from 'react';

const FROM = process.env.NEXT_PUBLIC_NCP_SENS_REGISTERED_SENDING_NUMBER || '01083151379'; // 발신 번호, 환경 변수로 설정 가능

export default function useSmsMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * 인증번호 발송 함수
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.phone
   * @param {string} params.message
   */
  const sendSmsMessage = async ({ name, phone, message }) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/send-sms-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,          
          to: phone,       
          message: message,           
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '메시지 발송에 실패했습니다.');
      }
      
      setData(result);
      return result;

    } catch (err) {
      setError(err.message);
      console.error("SMS 메시지 발송 실패:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendSmsMessage, loading, error, data };
}
