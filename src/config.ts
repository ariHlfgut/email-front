interface Config {
  API_URL: string;
}

function getApiUrl(): string {
  // בדיקה אם אנחנו ברנדר
  if (window.location.hostname.includes('render.com') || 
      window.location.hostname.includes('onrender.com')) {
    return 'https://email-sender-ikqf.onrender.com';
  }
  
  // בדיקה אם אנחנו בפרודקשן
  if (process.env.NODE_ENV === 'production') {
    return 'https://email-sender-ikqf.onrender.com';
  }
  
  // ברירת מחדל - פיתוח מקומי
  return 'http://localhost:3000';
}

const config: Config = {
  API_URL: getApiUrl()
};

console.log('Current environment:', process.env.NODE_ENV);
console.log('Current hostname:', window.location.hostname);
console.log('Using API URL:', config.API_URL);

export default config; 