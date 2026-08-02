// Production API Client initialized
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token to every outgoing request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Automatic Refresh Token Auto-Renewal Flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) { //agar same request ko repeat kara maine refreshToken
      //karne ke baad aur bo dubara se reject ho gyi tab hamara if nhi chlagea aur directly if ke baad bali line chalegi aur request reject ho jayegi
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call silent refresh token endpoint
        const res = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        if (res.data.success) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data;
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original failed request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) { //agar backend se message aaya token revoke ho chuka hai(admin se revoked mark kar dia tha tab fir ye)
        //block chalgea aur user ko login page par bhej dia jayega, ya fir manlo 2 3 reuests ek sath gyi aur teeno me old token tha to pahle
        //request ne return kara 401 jiski bajah se refreshToken hua aur us request ko repeat kar dia naye token ke sath and it successfuly
        //get executed but the remaining two requests which are holding the old token when they will go to perform their work, jwt.verify will
        //see that token is already revoked and it will throw 401 error and because of that error, it will also try to refreshToken and will got
        //to refreshToken block but there that token will be catched by if block having token.isRevoked which will be true as this token 
        //is already revoked hence it will throw eroor and this catch block will get executed and user will be sent to login page
        // Clear storage & redirect to login page if refresh token is revoked/expired
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

//hamara seeded tasks demo user ki id se seed ho rahe hai createdBy me isliye usse 4 tasks mil jate hai aur, admin ko bina kisi filter ke 
//sare tasks lakar de diye jate hai isliye use sare miljate hai