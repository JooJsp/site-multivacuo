const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');

    hamburger.classList.toggle('active');
});

const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

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

const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    }
});

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

document.querySelectorAll('.feature-card, .produto-card, .servico-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

const contactForm = document.querySelector('.contato-form form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // lógica de envio do formulário

        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        contactForm.reset();
    });
}

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

const consultaForm = document.getElementById('consultaForm');
const consultaError = document.getElementById('consultaError');
const consultaLoading = document.getElementById('consultaLoading');
const consultaResultado = document.getElementById('consultaResultado');
const fecharResultadoBtn = document.getElementById('fecharResultado');

const API_URL = 'https://script.google.com/macros/s/AKfycbyosKJjzLArp4Ao-IjHCiIOfVoHHhMPK1zE5WwHG20WdOGPGT_MAL0n0QcN6pGgsfWj/exec';

function formatarCNPJ(valor) {
    valor = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (valor.length <= 2) {
        return valor;
    } else if (valor.length <= 5) {
        return valor.replace(/^(.{2})(.+)/, '$1.$2');
    } else if (valor.length <= 8) {
        return valor.replace(/^(.{2})(.{3})(.+)/, '$1.$2.$3');
    } else if (valor.length <= 12) {
        return valor.replace(/^(.{2})(.{3})(.{3})(.+)/, '$1.$2.$3/$4');
    } else {
        return valor.replace(/^(.{2})(.{3})(.{3})(.{4})(.+)/, '$1.$2.$3/$4-$5').slice(0, 18);
    }
}

function extrairCNPJ(cnpj) {
    return cnpj.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

const cnpjInput = document.getElementById('cnpjCliente');
if (cnpjInput) {
    cnpjInput.addEventListener('input', (e) => {
        e.target.value = formatarCNPJ(e.target.value);
    });
}

if (consultaForm) {
    consultaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cnpjCliente = extrairCNPJ(document.getElementById('cnpjCliente').value);
        const numeroSerie = document.getElementById('numeroSerie').value.trim().toUpperCase();
        const consultaErrorMsg = document.getElementById('consultaErrorMsg');

        if (cnpjCliente.length !== 14) {
            consultaError.style.display = 'flex';
            consultaErrorMsg.textContent = 'CNPJ inválido. Digite os 14 dígitos do CNPJ.';
            return;
        }

        consultaError.style.display = 'none';
        consultaResultado.style.display = 'none';

        consultaLoading.style.display = 'flex';

        try {
            if (API_URL === 'URL_API') {
                throw new Error('Configure a URL do Apps Script no arquivo script.js');
            }

            const url = `${API_URL}?cnpj=${cnpjCliente}&serie=${encodeURIComponent(numeroSerie)}`;
            const response = await fetch(url);
            const data = await response.json();

            consultaLoading.style.display = 'none';

            if (data.success) {
                const bomba = data.bomba;

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

                const historicoDiv = document.getElementById('resultHistorico');
                const historicoTexto = document.getElementById('resultHistoricoTexto');

                if (bomba.historico && bomba.historico.trim() !== '') {
                    historicoTexto.innerHTML = bomba.historico
                        .split(/\n|\\n/)
                        .filter(item => item.trim() !== '')
                        .map(item => `<p>${item.trim()}</p>`)
                        .join('');
                    historicoDiv.style.display = 'block';
                } else {
                    historicoDiv.style.display = 'none';
                }

                const observacoesDiv = document.getElementById('resultObservacoes');
                const observacoesTexto = document.getElementById('resultObservacoesTexto');

                if (bomba.observacoes && bomba.observacoes.trim() !== '') {
                    observacoesTexto.innerHTML = bomba.observacoes
                        .replace(/\n/g, '<br>')
                        .replace(/\\n/g, '<br>');
                    observacoesDiv.style.display = 'block';
                } else {
                    observacoesDiv.style.display = 'none';
                }

                consultaResultado.style.display = 'block';

                consultaResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            } else {
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

    if (fecharResultadoBtn) {
        fecharResultadoBtn.addEventListener('click', () => {
            consultaResultado.style.display = 'none';
            consultaForm.reset();
        });
    }
}

