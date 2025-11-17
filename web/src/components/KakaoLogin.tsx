import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface KakaoLoginProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

const KakaoLogin: React.FC<KakaoLoginProps> = ({
  onSuccess,
  onError,
  className = '',
  children,
}) => {
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Handle OAuth callback (when redirected back from Kakao)
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state && window.location.pathname.includes('/auth/kakao/callback')) {
        setLoading(true);

        try {
          const response = await axios.get(
            `${apiUrl}/auth/kakao/callback?code=${code}&state=${state}`
          );

          // Store tokens
          if (response.data.accessToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
          }
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }

          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);

          if (onSuccess) {
            onSuccess(response.data);
          }
        } catch (error: any) {
          console.error('Kakao login callback error:', error);
          if (onError) {
            onError(error);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    handleCallback();
  }, [apiUrl, onSuccess, onError]);

  const handleKakaoLogin = async () => {
    setLoading(true);

    try {
      // Get Kakao authorization URL from backend
      const response = await axios.get(`${apiUrl}/auth/kakao`);
      const { authUrl } = response.data;

      // Redirect to Kakao login page
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Failed to get Kakao auth URL:', error);
      setLoading(false);
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <button
      onClick={handleKakaoLogin}
      disabled={loading}
      className={className || 'kakao-login-button'}
      style={
        !className
          ? {
              backgroundColor: '#FEE500',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.6 : 1,
            }
          : undefined
      }
    >
      {loading ? (
        '로그인 중...'
      ) : (
        <>
          {children || (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 0C4.03 0 0 3.47 0 7.75C0 10.39 1.58 12.71 4.02 14.08L3.09 17.59C3.01 17.88 3.28 18.14 3.56 18.01L7.62 15.94C8.07 15.98 8.53 16 9 16C13.97 16 18 12.53 18 8.25C18 3.97 13.97 0 9 0Z"
                  fill="#000000"
                />
              </svg>
              카카오 로그인
            </>
          )}
        </>
      )}
    </button>
  );
};

export default KakaoLogin;
