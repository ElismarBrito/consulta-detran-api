const express = require('express');
const consultaDetran = require('./consultaDetran');
const app = express();
app.use(express.json());

app.post('/consulta-detran', async (req, res) => {
  const { cpf, renavam } = req.body;

  try {
    const resultado = await consultaDetran(cpf, renavam);
    res.json({ sucesso: true, dados: resultado });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
