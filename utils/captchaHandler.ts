import axios from 'axios';

export const solveCaptcha = async (sitekey: string, url: string) => {
  const API_KEY = process.env.CAPTCHA_SERVICE_API_KEY;
  const response = await axios.post(
    `https://2captcha.com/in.php?key=${API_KEY}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${url}`
  );
  
  if (response.data.status === 1) {
    const captchaId = response.data.request;
    return new Promise<string>((resolve) => {
      const interval = setInterval(async () => {
        const result = await axios.get(
          `https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${captchaId}`
        );
        if (result.data.status === 1) {
          clearInterval(interval);
          resolve(result.data.request);
        }
      }, 5000);
    });
  }
  throw new Error('CAPTCHA solving failed');
};
