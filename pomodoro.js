const display = document.getElementById('display');
const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');
const btnsModo = document.querySelectorAll('.btn-modo');
const sessoesEl = document.getElementById('sessoes');
const inputTempo = document.getElementById('input-tempo');

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
    document.title = 'Pomodoro';
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

display.addEventListener('click', function () {
    if (rodando) return; // não permite editar com o timer rodando

    display.classList.add('escondido');
    inputTempo.classList.remove('escondido');
    inputTempo.value = display.textContent;
    inputTempo.focus();
    inputTempo.select();
});

function salvarNovoTempo() {
    const partes = inputTempo.value.split(':');
    const minutos = parseInt(partes[0]);
    const segundos = parseInt(partes[1]) || 0;

    // Valida se é um formato MM:SS válido
    if (!isNaN(minutos) && minutos >= 0) {
        const totalSegundos = (minutos * 60) + segundos;
        modos[modoAtual] = totalSegundos; // atualiza o modo atual
        restante = totalSegundos;
        atualizarDisplay();
    }

    // Volta pro display independente de ter salvo ou não
    inputTempo.classList.add('escondido');
    display.classList.remove('escondido');
}

inputTempo.addEventListener('blur', salvarNovoTempo);

inputTempo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') inputTempo.blur(); // dispara o blur que já salva
    if (e.key === 'Escape') {                 // cancela sem salvar
        inputTempo.classList.add('escondido');
        display.classList.remove('escondido');
    }
});

/* LÓGICA DE TAREFAS DA SEMANA  */

const DIAS = [
    { chave: 'segunda',  nome: 'Segunda-feira' },
    { chave: 'terca',    nome: 'Terça-feira'   },
    { chave: 'quarta',   nome: 'Quarta-feira'  },
    { chave: 'quinta',   nome: 'Quinta-feira'  },
    { chave: 'sexta',    nome: 'Sexta-feira'   },
    { chave: 'sabado',   nome: 'Sábado'        },
    { chave: 'domingo',  nome: 'Domingo'       }
];

const diaSemanaJS  = new Date().getDay();
const INDICE_HOJE  = diaSemanaJS === 0 ? 6 : diaSemanaJS - 1;
const CHAVE_HOJE   = DIAS[INDICE_HOJE].chave;

// Variável de estado: guarda qual dia está esperando a nova tarefa
let diaParaAdicionar = null;

// CARREGAR / SALVAR 

function carregarTarefas() {
    const salvo = localStorage.getItem('pomodoro-tarefas');
    return salvo ? JSON.parse(salvo) : [];
}

function salvarTarefas(tarefas) {
    // Converte o array pra texto e guarda no localStorage
    localStorage.setItem('pomodoro-tarefas', JSON.stringify(tarefas));
}

// CRUD 

function adicionarTarefa(dia, nome, horas) {
    const tarefas = carregarTarefas();

    // Cria o objeto da nova tarefa
    const novaTarefa = {
        id: Date.now(),
        dia: dia,
        nome: nome,
        horas: horas,
        completa: false
    };

    tarefas.push(novaTarefa);
    salvarTarefas(tarefas);
    renderizarSemana(); // pra atualizar a tela com a nova tarefa imediatamente
}

function removerTarefa(id) {
    let tarefas = carregarTarefas();
    tarefas = tarefas.filter(function(t) { return t.id !== id; });
    salvarTarefas(tarefas);
    renderizarSemana();
}

function toggleTarefa(id) {
    const tarefas = carregarTarefas();
    const tarefa = tarefas.find(function(t) { return t.id === id; });
    if (tarefa) {
        tarefa.completa = !tarefa.completa;
    }
    salvarTarefas(tarefas);
    renderizarSemana();
}

//  RENDERIZAÇÃO 

function renderizarSemana() {
    const semanaEl   = document.getElementById('semana');
    const tarefas    = carregarTarefas();

    semanaEl.innerHTML = '';

    DIAS.forEach(function(dia) {
        // Filtra só as tarefas desse dia
        const tarefasDoDia = tarefas.filter(function(t) { return t.dia === dia.chave; });
        const ehHoje       = dia.chave === CHAVE_HOJE;
        const totalHoras   = tarefasDoDia.reduce(function(acc, t) { return acc + t.horas; }, 0);
        const concluidas   = tarefasDoDia.filter(function(t) { return t.completa; }).length;
        const progresso    = tarefasDoDia.length > 0
            ? Math.round((concluidas / tarefasDoDia.length) * 100)
            : 0;

        // Monta o HTML do card
        const card = document.createElement('div');
        card.classList.add('day-card');
        if (ehHoje) card.classList.add('dia-hoje');

        // Cabeçalho do card
        card.innerHTML = `
            <div class="day-header">
                <span class="day-nome ${ehHoje ? 'hoje' : ''}">
                    ${dia.nome}
                    ${ehHoje ? '<span class="badge-hoje">hoje</span>' : ''}
                </span>
                <button class="btn-add-task" data-dia="${dia.chave}" title="Adicionar tarefa">+</button>
            </div>
            <div class="task-lista" id="lista-${dia.chave}"></div>
            ${tarefasDoDia.length > 0 ? `
            <div class="day-footer">
                <div class="day-stats">
                    <span>Total: ${formatarHoras(totalHoras)}</span>
                    <span>${concluidas}/${tarefasDoDia.length} concluída${concluidas !== 1 ? 's' : ''}</span>
                </div>
                <div class="barra-progresso">
                    <div class="barra-fill" style="width: ${progresso}%"></div>
                </div>
            </div>` : ''}
        `;

        // Adiciona os itens de tarefa na lista
        const listaEl = card.querySelector(`#lista-${dia.chave}`);
        if (tarefasDoDia.length === 0) {
            listaEl.innerHTML = '<p class="task-vazia">Nenhuma tarefa</p>';
        } else {
            tarefasDoDia.forEach(function(tarefa) {
                const item = document.createElement('div');
                item.classList.add('task-item');
                if (tarefa.completa) item.classList.add('completa');

                item.innerHTML = `
                    <button class="task-check ${tarefa.completa ? 'marcado' : ''}" 
                            data-id="${tarefa.id}" title="Marcar como concluída">
                        ${tarefa.completa ? '✓' : ''}
                    </button>
                    <span class="task-nome">${tarefa.nome}</span>
                    <span class="task-horas">${formatarHoras(tarefa.horas)}</span>
                    <button class="btn-remover" data-id="${tarefa.id}" title="Remover">✕</button>
                `;

                listaEl.appendChild(item);
            });
        }

        semanaEl.appendChild(card);
    });

    // Adiciona os eventos nos botões recém criados
    // (precisa fazer aqui pois o innerHTML recria os elementos)
    vincularEventosTarefas();
}

// Formata horas: 1.5 → "1h30" | 2 → "2h"
function formatarHoras(horas) {
    const h   = Math.floor(horas);
    const min = Math.round((horas - h) * 60);
    if (min === 0) return h + 'h';
    return h + 'h' + min;
}

// EVENTOS DOS CARDS (delegação) 

function vincularEventosTarefas() {
    // Botões de adicionar tarefa (um por dia)
    document.querySelectorAll('.btn-add-task').forEach(function(btn) {
        btn.addEventListener('click', function() {
            abrirModal(btn.dataset.dia);
        });
    });

    // Botões de marcar/desmarcar tarefa
    document.querySelectorAll('.task-check').forEach(function(btn) {
        btn.addEventListener('click', function() {
            toggleTarefa(Number(btn.dataset.id));
        });
    });

    // Botões de remover tarefa
    document.querySelectorAll('.btn-remover').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removerTarefa(Number(btn.dataset.id));
        });
    });
}

// MODAL 

const modalOverlay  = document.getElementById('modal-overlay');
const inputNome     = document.getElementById('input-nome');
const inputHoras    = document.getElementById('input-horas');
const btnCancelar   = document.getElementById('btn-cancelar');
const btnConfirmar  = document.getElementById('btn-confirmar');
const modalTitulo   = document.getElementById('modal-titulo');

function abrirModal(dia) {
    diaParaAdicionar = dia;
    const nomeDia = DIAS.find(function(d) { return d.chave === dia; }).nome;
    modalTitulo.textContent = 'Adicionar tarefa — ' + nomeDia;
    inputNome.value  = '';
    inputHoras.value = '1';
    modalOverlay.classList.remove('escondido');
    inputNome.focus();
}

function fecharModal() {
    modalOverlay.classList.add('escondido');
    diaParaAdicionar = null;
}

btnCancelar.addEventListener('click', fecharModal);

// Fecha o modal se clicar fora dele (no overlay escuro)
modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) fecharModal();
});

btnConfirmar.addEventListener('click', function() {
    const nome  = inputNome.value.trim();
    const horas = parseFloat(inputHoras.value);

    if (!nome) {
        inputNome.focus();
        inputNome.style.borderColor = '#e63946';
        setTimeout(function() { inputNome.style.borderColor = ''; }, 1000);
        return;
    }
    if (!horas || horas <= 0) return;

    adicionarTarefa(diaParaAdicionar, nome, horas);
    fecharModal();
});

// Confirmar com Enter no campo de nome
inputNome.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') btnConfirmar.click();
});

//  NAVEGAÇÃO ENTRE TELAS 
const slider         = document.getElementById('slider');
const btnIrTarefas   = document.getElementById('btn-ir-tarefas');
const btnVoltarTimer = document.getElementById('btn-voltar-timer');

btnIrTarefas.addEventListener('click', function() {
    slider.classList.add('na-tela-tarefas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

btnVoltarTimer.addEventListener('click', function() {
    slider.classList.remove('na-tela-tarefas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// INICIALIZAÇÃO 
renderizarSemana();