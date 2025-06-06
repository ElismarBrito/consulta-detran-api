# ================================
# README.md
# ================================

# API Consulta Detran-RJ

API para consulta de "nada consta" no Detran do Rio de Janeiro com resolução automática de CAPTCHA.

## 🚀 Funcionalidades

- ✅ Consulta automatizada ao Detran-RJ
- ✅ Resolução automática de CAPTCHA via 2captcha
- ✅ Validação de CPF e RENAVAM
- ✅ Rate limiting (proteção contra spam)
- ✅ Logs detalhados
- ✅ Tratamento robusto de erros
- ✅ Estrutura modular e organizada

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no [2captcha.com](https://2captcha.com)
- Chave de API do 2captcha

## 🔧 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com sua chave do 2captcha:
```
CAPTCHA_API_KEY=sua_chave_do_2captcha_aqui
PORT=10000
```

## 🚀 Uso

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

## 📡 API Endpoints

### POST /consulta

Realiza consulta de nada consta no Detran-RJ.

**Corpo da requisição:**
```json
{
  "cpf": "12345678900",
  "renavam": "12345678901"
}
```

**Resposta de sucesso:**
```json
{
  "sucesso": true,
  "dados": {
    "status": "regular",
    "cpf": "***456789**",
    "renavam": "12345678901",
    "resultado": "Nada consta - Situação regular",
    "dataConsulta": "2025-06-05T10:30:00.000Z"
  },
  "timestamp": "2025-06-05T10:30:00.000Z"
}
```

**Resposta de erro:**
```json
{
  "sucesso": false,
  "erro": "CPF inválido",
  "timestamp": "2025-06-05T10:30:00.000Z"
}
```

### GET /health

Verifica se a API está funcionando.

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2025-06-05T10:30:00.000Z"
}
```

## 🔒 Segurança

- Rate limiting: máximo 10 requests por minuto por IP
- Validação rigorosa de CPF e RENAVAM
- Mascaramento de dados sensíveis nos logs
- Variáveis de ambiente para credenciais
- CORS configurado

## 📁 Estrutura do Projeto

```
/
├── index.js                     # Servidor principal
├── services/
│   └── consultaDetranService.js # Lógica de consulta
├── utils/
│   ├── captchaSolver.js        # Resolução de CAPTCHA
│   └── validators.js           # Validadores CPF/RENAVAM
├── .env.example               # Exemplo de variáveis
├── .gitignore                # Arquivos ignorados
└── package.json              # Dependências

```

## ⚠️ Limitações

- Funciona apenas para consultas do Detran-RJ
- Depende do serviço 2captcha (pago)
- Sujeito a mudanças no site do Detran

## 🐛 Solução de Problemas

### Erro de CAPTCHA
- Verifique se sua chave do 2captcha está correta
- Verifique se há saldo em sua conta 2captcha

### Timeout na consulta
- O site do Detran pode estar lento
- Tente novamente após alguns minutos

### Erro de validação
- Verifique se CPF e RENAVAM estão corretos
- CPF deve ter 11 dígitos
- RENAVAM deve ter 11 dígitos

## 📝 Licença

MIT License