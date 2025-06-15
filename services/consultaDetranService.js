// ================================
// services/consultaDetranService.js (VERSÃO ATUALIZADA)
// ================================

const puppeteer = require('puppeteer');
const cheerio = require('cheerio'); // Importar Cheerio
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
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      console.log('Navegando para o site do Detran...');
      await page.goto(PAGE_URL, { 
        waitUntil: 'networkidle2',
        timeout: 45000 
      });

      console.log('Preenchendo formulário...');
      await page.waitForSelector('input[name="data[Multas][renavam]"]', { timeout: 10000 });
      await page.type('input[name="data[Multas][renavam]"]', renavam, { delay: 100 });
      
      await page.waitForSelector('input[name="data[Multas][cpfcnpj]"]', { timeout: 10000 });
      await page.type('input[name="data[Multas][cpfcnpj]"]', cpf, { delay: 100 });

      console.log('Resolvendo CAPTCHA...');
      const token = await captchaSolver.resolve(PAGE_URL);

      await page.evaluate((token) => {
        const el = document.querySelector('#g-recaptcha-response');
        if (el) {
          el.style.display = 'block';
          el.value = token;
        }
      }, token);

      console.log('Submetendo formulário...');
      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ 
          waitUntil: 'networkidle2',
          timeout: 45000 
        }),
      ]);

      const html = await page.content();
      const resultado = this.extrairResultado(html);
      
      return {
        ...resultado,
        cpf: cpf.replace(/\d(?=\d{4})/g, '*'), // Mascarar CPF na resposta
        renavam,
        dataConsulta: new Date().toISOString()
      };

    } catch (erro) {
      console.error('Erro na consulta:', erro.message);
      // Captura de tela para depuração
      if(page) await page.screenshot({ path: 'erro_screenshot.png' });
      throw new Error('Falha na consulta ao Detran: ' + erro.message);
    } finally {
      if (browser) {
        await browser.close();
        console.log('Browser fechado.');
      }
    }
  }

  extrairResultado(html) {
    const $ = cheerio.load(html);

    if (html.toLowerCase().includes('nada consta')) {
      return {
        status: 'regular',
        resultado: 'Nada consta - Situação regular',
        multas: []
      };
    }

    const multas = [];
    const totalMultasText = $('.paginate').first().text().trim();
    
    $('table.tabelaDescricao').each((i, table) => {
      const multa = {};
      const rows = $(table).find('tbody > tr');
      
      multa.statusInfração = $(table).find('thead th').text().trim();
      
      const getTextAfterBr = (td) => $(td).html().split('<br>')[1]?.trim() || '';
      
      // Linha 1
      multa.autoDeInfracao = getTextAfterBr($(rows[0]).find('td').eq(0));
      multa.autoDeRenainf = getTextAfterBr($(rows[0]).find('td').eq(1));
      multa.pagamentoComDesconto = getTextAfterBr($(rows[0]).find('td').eq(2));
      
      // Linha 2
      multa.enquadramento = getTextAfterBr($(rows[1]).find('td').eq(0));
      multa.data = getTextAfterBr($(rows[1]).find('td').eq(1));
      multa.hora = getTextAfterBr($(rows[1]).find('td').eq(2));
      
      // Linha 3
      multa.descricao = getTextAfterBr($(rows[2]).find('td').eq(0));
      multa.placa = getTextAfterBr($(rows[2]).find('td').eq(1));
      
      // Linha 4
      multa.local = getTextAfterBr($(rows[3]).find('td').eq(0));
      multa.valorOriginal = getTextAfterBr($(rows[3]).find('td').eq(1));
      multa.valorAPagar = getTextAfterBr($(rows[3]).find('td').eq(2));
      
      // Linha 5
      multa.statusPagamento = getTextAfterBr($(rows[4]).find('td').eq(0));
      multa.orgaoEmissor = getTextAfterBr($(rows[4]).find('td').eq(1));
      multa.agenteEmissor = getTextAfterBr($(rows[4]).find('td').eq(2));

      multas.push(multa);
    });

    if (multas.length > 0) {
      return {
        status: 'pendencia',
        resultado: totalMultasText || `${multas.length} multa(s) encontrada(s).`,
        multas
      };
    }
    
    // Fallback para erro ou dados não encontrados
    const mensagemErro = $('#caixaInformacao').text().trim();
    return {
      status: 'erro',
      resultado: mensagemErro || 'Dados não encontrados ou formato de resposta inesperado.',
      multas: []
    };
  }
}

module.exports = new ConsultaDetranService();