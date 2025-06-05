const axios = require('axios');

module.exports = async function solveCaptcha(siteKey, pageUrl) {
  const apiKey = process.env.CAPTCHA_API_KEY;
  const { data: start } = await axios.get(`http://2captcha.com/in.php?key=${apiKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}&json=1`);

  if (start.status !== 1) throw new Error('Erro ao enviar CAPTCHA');

  const requestId = start.request;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const { data: result } = await axios.get(`http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`);
    if (result.status === 1) return result.request;
    if (result.request !== 'CAPCHA_NOT_READY') throw new Error('Erro CAPTCHA: ' + result.request);
  }

  throw new Error('Timeout esperando o CAPTCHA');
};