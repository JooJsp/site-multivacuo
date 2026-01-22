// Menu Hamburguer para Mobile
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');

    // Animação do hamburguer
    hamburger.classList.toggle('active');
});

// Fecha o menu ao clicar em um link
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Scroll suave para links âncora
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 70;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header fixo com sombra ao scroll
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    }
});

// Animação de entrada dos cards ao scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observa todos os cards
document.querySelectorAll('.feature-card, .produto-card, .servico-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Validação e envio do formulário
const contactForm = document.querySelector('.contato-form form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Aqui você pode adicionar a lógica de envio do formulário
        // Por exemplo, enviar para um servidor ou serviço de email

        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        contactForm.reset();
    });
}

// Adiciona classe active ao link do menu baseado na seção visível
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Sistema de Consulta de Bombas por Número de Série
const consultaForm = document.getElementById('consultaForm');
const consultaError = document.getElementById('consultaError');
const consultaLoading = document.getElementById('consultaLoading');
const consultaResultado = document.getElementById('consultaResultado');
const fecharResultadoBtn = document.getElementById('fecharResultado');

// URL da API segura (Google Apps Script)
const API_URL = 'https://script.google.com/macros/s/AKfycbyosKJjzLArp4Ao-IjHCiIOfVoHHhMPK1zE5WwHG20WdOGPGT_MAL0n0QcN6pGgsfWj/exec';

// Função para formatar CNPJ enquanto digita
function formatarCNPJ(valor) {
    // Remove tudo que não é número
    valor = valor.replace(/\D/g, '');

    // Aplica a máscara do CNPJ: 00.000.000/0000-00
    if (valor.length <= 2) {
        return valor;
    } else if (valor.length <= 5) {
        return valor.replace(/(\d{2})(\d+)/, '$1.$2');
    } else if (valor.length <= 8) {
        return valor.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (valor.length <= 12) {
        return valor.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    } else {
        return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5').slice(0, 18);
    }
}

// Função para extrair apenas números do CNPJ
function extrairNumerosCNPJ(cnpj) {
    return cnpj.replace(/\D/g, '');
}

// Adiciona formatação automática ao campo de CNPJ
const cnpjInput = document.getElementById('cnpjCliente');
if (cnpjInput) {
    cnpjInput.addEventListener('input', (e) => {
        e.target.value = formatarCNPJ(e.target.value);
    });
}

if (consultaForm) {
    consultaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cnpjCliente = extrairNumerosCNPJ(document.getElementById('cnpjCliente').value);
        const numeroSerie = document.getElementById('numeroSerie').value.trim().toUpperCase();
        const consultaErrorMsg = document.getElementById('consultaErrorMsg');

        // Valida se o CNPJ tem 14 dígitos
        if (cnpjCliente.length !== 14) {
            consultaError.style.display = 'flex';
            consultaErrorMsg.textContent = 'CNPJ inválido. Digite os 14 dígitos do CNPJ.';
            return;
        }

        // Esconde mensagens anteriores
        consultaError.style.display = 'none';
        consultaResultado.style.display = 'none';

        // Mostra loading
        consultaLoading.style.display = 'flex';

        try {
            // Verifica se a API está configurada
            if (API_URL === 'COLE_AQUI_A_URL_DO_APPS_SCRIPT') {
                throw new Error('Configure a URL do Apps Script no arquivo script.js');
            }

            // Faz a requisição para a API segura
            const url = `${API_URL}?cnpj=${cnpjCliente}&serie=${encodeURIComponent(numeroSerie)}`;
            const response = await fetch(url);
            const data = await response.json();

            // Esconde loading
            consultaLoading.style.display = 'none';

            if (data.success) {
                const bomba = data.bomba;

                // Preenche os resultados
                document.getElementById('resultNomeCliente').textContent = bomba.nomeCliente;
                document.getElementById('resultNumeroSerie').textContent = bomba.numeroSerie;
                document.getElementById('resultModelo').textContent = bomba.modelo;
                document.getElementById('resultDataFabricacao').textContent = bomba.dataFabricacao;
                document.getElementById('resultMotorPotencia').textContent = bomba.motorPotencia;
                document.getElementById('resultMotorMarca').textContent = bomba.motorMarca;
                document.getElementById('resultCorpo').textContent = bomba.materialCorpo;
                document.getElementById('resultRotor').textContent = bomba.materialRotor;
                document.getElementById('resultPlaca').textContent = bomba.materialPlaca;
                document.getElementById('resultFrente').textContent = bomba.materialFrente;
                document.getElementById('resultSelo').textContent = bomba.materialSelo;

                // Mostra observações se existirem
                const observacoesDiv = document.getElementById('resultObservacoes');
                const observacoesTexto = document.getElementById('resultObservacoesTexto');

                if (bomba.observacoes && bomba.observacoes.trim() !== '') {
                    // Converte quebras de linha para HTML
                    observacoesTexto.innerHTML = bomba.observacoes
                        .replace(/\n/g, '<br>')
                        .replace(/\\n/g, '<br>');
                    observacoesDiv.style.display = 'block';
                } else {
                    observacoesDiv.style.display = 'none';
                }

                // Mostra o resultado
                consultaResultado.style.display = 'block';

                // Scroll suave até o resultado
                consultaResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            } else {
                // Erro retornado pela API
                consultaError.style.display = 'flex';
                consultaErrorMsg.textContent = data.error;
            }

        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            consultaLoading.style.display = 'none';
            consultaError.style.display = 'flex';
            consultaErrorMsg.textContent =
                error.message.includes('Configure')
                    ? error.message
                    : 'Erro ao buscar dados. Tente novamente.';
        }
    });

    // Botão para fechar resultados
    if (fecharResultadoBtn) {
        fecharResultadoBtn.addEventListener('click', () => {
            consultaResultado.style.display = 'none';
            consultaForm.reset();
        });
    }
}

// Função para converter CSV em array de objetos de bombas
// ESTRUTURA DA PLANILHA (11 colunas):
// CNPJ | Numero de Serie | Modelo | Data de Fabricacao | Motor Potencia | Motor Marca |
// Material Corpo | Material Rotor | Material Placa | Material Frente | Observacoes
function parseCSVToBombas(csvText) {
    // Parser que lida com quebras de linha dentro de células (entre aspas)
    const rows = parseCSVWithLineBreaks(csvText);
    const bombas = [];

    // Pula a primeira linha (cabeçalho)
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];

        if (values.length >= 9 && values[0].trim() !== '') {
            bombas.push({
                cnpj: values[0]?.trim() || '',
                numeroSerie: values[1]?.trim() || '',
                modelo: values[2]?.trim() || '',
                dataFabricacao: values[3]?.trim() || '',
                motorPotencia: values[4]?.trim() || '',
                motorMarca: values[5]?.trim() || '',
                materialCorpo: values[6]?.trim() || '',
                materialRotor: values[7]?.trim() || '',
                materialPlaca: values[8]?.trim() || '',
                materialFrente: values[9]?.trim() || '',
                tipoSelo: values[10]?.trim() || '',
                observacoes: values[11] || ''
            });
        }
    }

    return bombas;
}

// Parser CSV completo que preserva quebras de linha dentro de células
function parseCSVWithLineBreaks(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Aspas escapadas ("")
                currentCell += '"';
                i++;
            } else {
                // Início ou fim de texto entre aspas
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Fim da célula
            currentRow.push(currentCell);
            currentCell = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            // Fim da linha (fora de aspas)
            if (char === '\r') i++; // Pula o \n do \r\n
            currentRow.push(currentCell);
            if (currentRow.some(cell => cell.trim() !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else if (char === '\r' && !inQuotes) {
            // Fim da linha (apenas \r)
            currentRow.push(currentCell);
            if (currentRow.some(cell => cell.trim() !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            // Caractere normal (incluindo \n dentro de aspas)
            currentCell += char;
        }
    }

    // Adiciona última célula e linha
    currentRow.push(currentCell);
    if (currentRow.some(cell => cell.trim() !== '')) {
        rows.push(currentRow);
    }

    return rows;
}
