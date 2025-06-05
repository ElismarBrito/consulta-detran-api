// consulta-detran.js
const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
app.use(express.json());

const PAGE_URL = 'https://www.detran.rj.gov.br/consultas/consultas-drv/nada-consta.html';
const SITE_KEY = '6LfP47IUAAAAAIwbI5NOKHyvT9Pda17dl0nXl4xv';
const CAPTCHA_API_KEY = '82eed5a53a3baecf6bd05490302b51d2';

async function resolveCaptcha() {
  const { data: inRes } = await axios.get(`http://2captcha.com/in.php?key=${CAPTCHA_API_KEY}&method=userrecaptcha&googlekey=${SITE_KEY}&pageurl=${PAGE_URL}&json=1`);
  if (inRes.status !== 1) throw new Error('Erro ao enviar captcha');

  const requestId = inRes.request;
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const { data: res } = await axios.get(`http://2captcha.com/res.php?key=${CAPTCHA_API_KEY}&action=get&id=${requestId}&json=1`);
    if (res.status === 1) return res.request;
    if (res.request !== 'CAPCHA_NOT_READY') throw new Error(res.request);
  }
  throw new Error('Timeout captcha');
}

app.post('/consulta-detran', async (req, res) => {
  const { cpf, renavam } = req.body;
  if (!cpf || !renavam) return res.status(400).json({ error: 'CPF e RENAVAM são obrigatórios' });

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(PAGE_URL, { waitUntil: 'networkidle2' });

  await page.type('input[name="renavam"]', renavam);
  await page.type('input[name="cpfCnpj"]', cpf);

  const token = await resolveCaptcha();

  await page.evaluate((token) => {
    const el = document.querySelector('#g-recaptcha-response');
    el.style.display = 'block';
    el.value = token;
  }, token);

  await Promise.all([
    page.click('input[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  const html = await page.content();
  await browser.close();

  // Aqui você pode melhorar para extrair só o que precisa
  const status = html.includes('NADA CONSTA') ? 'regular' : 'verificar';
  res.json({ status, html });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
