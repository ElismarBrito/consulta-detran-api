// ================================
// utils/captchaSolver.js
// ================================

const axios = require('axios');

const SITE_KEY = '6LfP47IUAAAAAIwbI5NOKHyvT9Pda17dl0nXl4xv';

class CaptchaSolver {
  constructor() {
    this.apiKey = process.env.CAPTCHA_API_KEY;
    if (!this.apiKey) {
      throw new Error('CAPTCHA_API_KEY não configurada nas variáveis de ambiente');
    }
  }

  async resolve(pageUrl) {
    try {
      // Enviar CAPTCHA para resolução
      const { data: submitResponse } = await axios.get(
        `http://2captcha.com/in.php?key=${this.apiKey}&method=userrecaptcha&googlekey=${SITE_KEY}&pageurl=${pageUrl}&json=1`
      );

      if (submitResponse.status !== 1) {
        throw new Error('Erro ao enviar CAPTCHA: ' + submitResponse.request);
      }

      const requestId = submitResponse.request;
      console.log(`CAPTCHA enviado. ID: ${requestId}`);

      // Aguardar resolução (máximo 2 minutos)
      for (let tentativa = 0; tentativa < 24; tentativa++) {
        await this.delay(5000); // Aguardar 5 segundos

        const { data: resultResponse } = await axios.get(
          `http://2captcha.com/res.php?key=${this.apiKey}&action=get&id=${requestId}&json=1`
        );

        if (resultResponse.status === 1) {
          console.log('CAPTCHA resolvido com sucesso');
          return resultResponse.request;
        }

        if (resultResponse.request !== 'CAPCHA_NOT_READY') {
          throw new Error('Erro na resolução do CAPTCHA: ' + resultResponse.request);
        }

        console.log(`Tentativa ${tentativa + 1}/24 - Aguardando resolução...`);
      }

      throw new Error('Timeout na resolução do CAPTCHA');

    } catch (erro) {
      throw new Error('Falha no CAPTCHA: ' + erro.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new CaptchaSolver();
