const display = document.getElementById('display');
const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');
const btnsModo = document.querySelectorAll('.btn-modo');
const sessoesEl = document.getElementById('sessoes');

const MAX_SESSOES = 4;
let sessaoAtual = 0;

// config de cada modo (tempo em segundos) 
const modos = {
    'foco': 25 * 60,
    'pausa-curta': 5 * 60,
    'pausa-longa': 15 * 60
}

// estado atual do timer 
let modoAtual = 'foco';
let restante = modos[modoAtual];
let rodando = false;
let intervalo = null;

// atualizar display do timer
function atualizarDisplay() {
    const minutos = Math.floor(restante / 60);
    const segundos = restante % 60;
    // padStart para garantir que apareça "05" e não "5"
    const min = String(minutos).padStart(2, '0');
    const seg = String(segundos).padStart(2, '0');
    
    display.textContent = min + ':' + seg;
    document.title = min + ':' + seg + ' - Pomodoro';
}

// iniciar o timer (Play, reset, pause) 
function toggleTimer() {
    if (rodando) {
        // Pausar 
        clearInterval(intervalo);
        rodando = false;
        btnPlay.textContent = '▶';
    } else {
        // Iniciar
        rodando = true;
        btnPlay.textContent = '⏸';
        intervalo = setInterval(function () {
            restante--;

            if (restante <= 0) {
                clearInterval(intervalo);
                rodando = false;
                btnPlay.textContent = '▶';
                tocarSom();

                if (modoAtual === 'foco') {
                    sessaoAtual++;
                    atualizarBolinha();

                    if (sessaoAtual >= MAX_SESSOES) {
                        sessaoAtual = 0;
                        setTimeout(function () { atualizarBolinha(); }, 400);
                        trocarModo('pausa-longa');
                    } else {
                        trocarModo('pausa-curta');
                    }
                } else {
                    // quando a pausa acabar volta pro foco 
                    trocarModo('foco');
                }

                return;
            }

            atualizarDisplay();
        }, 1000);
    }
}                              
function resetTimer() {
    clearInterval(intervalo);
    rodando = false;
    btnPlay.textContent = '▶';
    restante = modos[modoAtual];
    atualizarDisplay();
}
// função pra preencher a bolinha 
function atualizarBolinha() {
    sessoesEl.innerHTML = '';  

    for (let i = 0; i < MAX_SESSOES; i++) {
        const bolinha = document.createElement('div');
        bolinha.classList.add('bolinha');
        if (i < sessaoAtual) {
            bolinha.classList.add('completa');
        }
        sessoesEl.appendChild(bolinha);
    }
}

function trocarModo(modo) {
    btnsModo.forEach(function (btn) {
        btn.classList.remove('ativo');
        if (btn.dataset.modo === modo) {
            btn.classList.add('ativo');
        }
    });
    modoAtual = modo;
    restante = modos[modo];
    document.tittle = 'Pomodoro';
    atualizarDisplay();
}

btnPlay.addEventListener('click', toggleTimer);
btnReset.addEventListener('click', resetTimer);

btnsModo.forEach(function (btn) {
    btn.addEventListener('click', function () {
        trocarModo(btn.dataset.modo);
        clearInterval(intervalo);
        rodando = false;
        btnPlay.textContent = '▶';
    });
});

function tocarSom() {
    const contexto = new AudioContext();
    const oscilator = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilator.connect(ganho);
    ganho.connect(contexto.destination);

    oscilator.type = 'sine';
    oscilator.frequency.value = 440;

    ganho.gain.setValueAtTime(0.5, contexto.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + 1);

    oscilator.start(contexto.currentTime);
    oscilator.stop(contexto.currentTime + 1);
}

atualizarDisplay();
atualizarBolinha();