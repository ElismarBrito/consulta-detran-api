// ================================
// services/consultaDetranService.js
// ================================

const puppeteer = require('puppeteer');
const captchaSolver = require('../utils/captchaSolver');

const PAGE_URL = 'https://www.detran.rj.gov.br/consultas/consultas-drv/nada-consta.html';

class ConsultaDetranService {
  async consultar(cpf, renavam) {
    let browser;
    
    try {
      console.log('Iniciando browser...');
      browser = await puppeteer.launch({ 
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Configurações da página
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      console.log('Navegando para o site do Detran...');
      await page.goto(PAGE_URL, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Preenchimento dos campos
      console.log('Preenchendo formulário...');
      await page.waitForSelector('input[name="renavam"]', { timeout: 10000 });
      await page.type('input[name="renavam"]', renavam, { delay: 100 });
      
      await page.waitForSelector('input[name="cpfCnpj"]', { timeout: 10000 });
      await page.type('input[name="cpfCnpj"]', cpf, { delay: 100 });

      // Resolver CAPTCHA
      console.log('Resolvendo CAPTCHA...');
      const token = await captchaSolver.resolve(PAGE_URL);

      // Inserir token do CAPTCHA
      await page.evaluate((token) => {
        const el = document.querySelector('#g-recaptcha-response');
        if (el) {
          el.style.display = 'block';
          el.value = token;
        }
      }, token);

      // Submeter formulário
      console.log('Submetendo formulário...');
      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ 
          waitUntil: 'networkidle2',
          timeout: 30000 
        }),
      ]);

      // Extrair resultado
      const resultado = await this.extrairResultado(page);
      
      return {
        status: resultado.status,
        cpf: cpf.replace(/\d(?=\d{3})/g, '*'), // Mascarar CPF na resposta
        renavam,
        resultado: resultado.mensagem,
        dataConsulta: new Date().toISOString()
      };

    } catch (erro) {
      console.error('Erro na consulta:', erro.message);
      throw new Error('Falha na consulta ao Detran: ' + erro.message);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async extrairResultado(page) {
    try {
      const html = await page.content();
      
      // Verificar diferentes padrões de resposta
      if (html.includes('NADA CONSTA') || html.includes('nada consta')) {
        return {
          status: 'regular',
          mensagem: 'Nada consta - Situação regular'
        };
      }
      
      if (html.includes('PENDÊNCIA') || html.includes('pendência')) {
        return {
          status: 'pendencia',
          mensagem: 'Existem pendências'
        };
      }
      
      if (html.includes('ERRO') || html.includes('erro')) {
        return {
          status: 'erro',
          mensagem: 'Erro na consulta - Verifique os dados informados'
        };
      }

      // Se não encontrou padrões conhecidos, retornar para análise manual
      return {
        status: 'verificar',
        mensagem: 'Resultado requer verificação manual',
        html: html.length > 1000 ? html.substring(0, 1000) + '...' : html
      };

    } catch (erro) {
      throw new Error('Erro ao extrair resultado: ' + erro.message);
    }
  }
}

module.exports = new ConsultaDetranService();