// index.js - Servidor Principal
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const consultaDetranService = require('./services/consultaDetranService');
const { validateCPF, validateRENAVAM } = require('./utils/validators');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Rate limiting - máximo 10 requests por minuto por IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { erro: 'Muitas tentativas. Tente novamente em 1 minuto.' }
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint principal - ajustado para /consulta
app.post('/consulta', async (req, res) => {
  try {
    const { cpf, renavam } = req.body;

    // Validações
    if (!cpf || !renavam) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'CPF e RENAVAM são obrigatórios' 
      });
    }

    if (!validateCPF(cpf)) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'CPF inválido' 
      });
    }

    if (!validateRENAVAM(renavam)) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'RENAVAM inválido' 
      });
    }

    console.log(`Iniciando consulta - CPF: ${cpf.replace(/\d(?=\d{3})/g, '*')}, RENAVAM: ${renavam}`);

    const resultado = await consultaDetranService.consultar(cpf, renavam);
    
    res.json({ 
      sucesso: true, 
      dados: resultado,
      timestamp: new Date().toISOString()
    });

  } catch (erro) {
    console.error('Erro na consulta:', erro.message);
    
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro interno do servidor. Tente novamente em alguns minutos.',
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    sucesso: false, 
    erro: 'Endpoint não encontrado' 
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Consulta: POST http://localhost:${PORT}/consulta`);
});

module.exports = app;