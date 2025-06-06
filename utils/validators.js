// ================================
// utils/validators.js
// ================================

function validateCPF(cpf) {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

function validateRENAVAM(renavam) {
  // Remove caracteres não numéricos
  renavam = renavam.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (renavam.length !== 11) return false;
  
  // Algoritmo de validação do RENAVAM
  const sequence = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(renavam.charAt(i)) * sequence[i];
  }
  
  const digit = sum % 11;
  const expectedDigit = digit === 0 || digit === 1 ? 0 : 11 - digit;
  
  return expectedDigit === parseInt(renavam.charAt(10));
}

module.exports = {
  validateCPF,
  validateRENAVAM
};