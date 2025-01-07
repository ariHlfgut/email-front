interface Config {
  API_URL: string;
}

const config: Config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
};

console.log('Current environment:', import.meta.env?.MODE);
console.log('Current hostname:', window.location.hostname);
console.log('Using API URL:', config.API_URL);

export default config; 