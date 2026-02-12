/**
 * Google Apps Script - Consulta de Bombas com Sistema de Log
 * Cole este código no seu projeto Apps Script (script.google.com)
 */

// Configurações
const CONFIG = {
  PLANILHA_ID: 'SEU_ID_DA_PLANILHA_AQUI', // ID da planilha do Google Sheets
  ABA_BOMBAS: 'Bombas',                    // Nome da aba com dados das bombas
  ABA_LOG: 'LogConsultas',                 // Nome da aba de log
  LIMITE_CONSULTAS_POR_HORA: 30            // Rate limiting
};

// Cache para rate limiting
const rateLimitCache = {};

/**
 * Função principal - recebe requisições GET
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * Função principal - recebe requisições POST
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Processa a requisição
 */
function handleRequest(e) {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // Extrai parâmetros
    const params = e.parameter || {};
    const cnpj = limparCNPJ(params.cnpj || '');
    const numeroSerie = (params.numeroSerie || '').trim().toUpperCase();

    // Validações básicas
    if (!cnpj || !numeroSerie) {
      return criarResposta({
        success: false,
        error: 'CNPJ e número de série são obrigatórios'
      }, headers);
    }

    // Valida formato do CNPJ
    if (!validarCNPJ(cnpj)) {
      registrarLog(cnpj, '', numeroSerie, 'CNPJ Inválido', false);
      return criarResposta({
        success: false,
        error: 'CNPJ inválido'
      }, headers);
    }

    // Rate limiting
    if (verificarRateLimit(cnpj)) {
      registrarLog(cnpj, '', numeroSerie, 'Rate Limit', false);
      return criarResposta({
        success: false,
        error: 'Muitas consultas. Aguarde alguns minutos.'
      }, headers);
    }

    // Busca a bomba
    const resultado = buscarBomba(numeroSerie, cnpj);

    // Registra no log
    registrarLog(
      cnpj,
      resultado.nomeConsulta || '',
      numeroSerie,
      resultado.success ? 'Encontrado' : resultado.error,
      resultado.autorizado || false
    );

    return criarResposta(resultado, headers);

  } catch (error) {
    console.error('Erro na requisição:', error);
    return criarResposta({
      success: false,
      error: 'Erro interno do servidor'
    }, headers);
  }
}

/**
 * Busca a bomba na planilha
 */
function buscarBomba(numeroSerie, cnpjConsulta) {
  const ss = SpreadsheetApp.openById(CONFIG.PLANILHA_ID);
  const sheet = ss.getSheetByName(CONFIG.ABA_BOMBAS);

  if (!sheet) {
    return { success: false, error: 'Planilha não encontrada' };
  }

  const dados = sheet.getDataRange().getValues();
  const cabecalho = dados[0];

  // Mapeia índices das colunas
  const idx = {};
  cabecalho.forEach((col, i) => {
    idx[col.toString().toLowerCase().trim()] = i;
  });

  // Procura a bomba pelo número de série
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    const serieAtual = (linha[idx['numeroserie']] || linha[idx['numero serie']] || linha[idx['serie']] || '').toString().trim().toUpperCase();

    if (serieAtual === numeroSerie) {
      // Encontrou a bomba
      const cnpjDono = limparCNPJ((linha[idx['cnpj']] || '').toString());
      const autorizado = cnpjDono === cnpjConsulta;

      // Obtém nome da empresa que está consultando (pode buscar de outra fonte ou usar genérico)
      const nomeCliente = linha[idx['nomecliente']] || linha[idx['cliente']] || linha[idx['nome']] || '-';

      return {
        success: true,
        autorizado: autorizado,
        nomeConsulta: nomeCliente,
        bomba: {
          nomeCliente: nomeCliente,
          numeroSerie: serieAtual,
          modelo: linha[idx['modelo']] || '-',
          dataFabricacao: formatarData(linha[idx['datafabricacao']] || linha[idx['data fabricacao']] || linha[idx['fabricacao']]) || '-',
          motorPotencia: linha[idx['motorpotencia']] || linha[idx['potencia']] || '-',
          motorMarca: linha[idx['motormarca']] || linha[idx['marca motor']] || '-',
          materialCorpo: linha[idx['materialcorpo']] || linha[idx['corpo']] || '-',
          materialRotor: linha[idx['materialrotor']] || linha[idx['rotor']] || '-',
          materialPlaca: linha[idx['materialplaca']] || linha[idx['placa']] || '-',
          materialFrente: linha[idx['materialfrente']] || linha[idx['frente']] || '-',
          materialSelo: linha[idx['materialselo']] || linha[idx['selo']] || '-',
          historico: linha[idx['historico']] || '',
          observacoes: linha[idx['observacoes']] || linha[idx['obs']] || ''
        }
      };
    }
  }

  return {
    success: false,
    error: 'Bomba não encontrada',
    nomeConsulta: ''
  };
}

/**
 * Registra a consulta no log
 */
function registrarLog(cnpj, empresa, numeroSerie, resultado, autorizado) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.PLANILHA_ID);
    let logSheet = ss.getSheetByName(CONFIG.ABA_LOG);

    // Cria a aba de log se não existir
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.ABA_LOG);
      logSheet.appendRow([
        'Data',
        'Hora',
        'CNPJ',
        'Empresa',
        'Série Buscada',
        'Resultado',
        'Autorizado'
      ]);

      // Formata o cabeçalho
      const headerRange = logSheet.getRange(1, 1, 1, 7);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#0f2557');
      headerRange.setFontColor('#ffffff');
      logSheet.setFrozenRows(1);
    }

    const agora = new Date();
    const data = Utilities.formatDate(agora, 'America/Sao_Paulo', 'dd/MM/yyyy');
    const hora = Utilities.formatDate(agora, 'America/Sao_Paulo', 'HH:mm:ss');

    // Adiciona a linha de log
    logSheet.appendRow([
      data,
      hora,
      formatarCNPJ(cnpj),
      empresa || '-',
      numeroSerie || '-',
      resultado,
      autorizado ? 'Sim' : 'Não'
    ]);

  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
}

/**
 * Rate limiting por CNPJ
 */
function verificarRateLimit(cnpj) {
  const agora = Date.now();
  const umaHora = 60 * 60 * 1000;

  if (!rateLimitCache[cnpj]) {
    rateLimitCache[cnpj] = [];
  }

  // Remove consultas antigas (mais de 1 hora)
  rateLimitCache[cnpj] = rateLimitCache[cnpj].filter(t => agora - t < umaHora);

  // Verifica se excedeu o limite
  if (rateLimitCache[cnpj].length >= CONFIG.LIMITE_CONSULTAS_POR_HORA) {
    return true;
  }

  // Registra a consulta
  rateLimitCache[cnpj].push(agora);
  return false;
}

/**
 * Valida CNPJ
 */
function validarCNPJ(cnpj) {
  cnpj = limparCNPJ(cnpj);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0)) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(1)) return false;

  return true;
}

/**
 * Remove formatação do CNPJ
 */
function limparCNPJ(cnpj) {
  return (cnpj || '').replace(/[^\d]/g, '');
}

/**
 * Formata CNPJ para exibição
 */
function formatarCNPJ(cnpj) {
  cnpj = limparCNPJ(cnpj);
  if (cnpj.length !== 14) return cnpj;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata data para exibição
 */
function formatarData(valor) {
  if (!valor) return null;

  if (valor instanceof Date) {
    return Utilities.formatDate(valor, 'America/Sao_Paulo', 'dd/MM/yyyy');
  }

  return valor.toString();
}

/**
 * Cria resposta JSON com headers CORS
 */
function criarResposta(dados, headers) {
  const output = ContentService.createTextOutput(JSON.stringify(dados));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
