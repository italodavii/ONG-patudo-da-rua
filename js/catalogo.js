import { db } from './firebase-config.js';
import { 
    collection, getDocs, query, where, orderBy, 
    limit, startAfter, endBefore, limitToLast, getCountFromServer 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { criarCardPetHTML, configurarModal, configurarLightbox, reveal } from './utils.js';

// --- Variáveis de Controle ---
let ultimoDoc = null;    
let primeiroDoc = null; 
let paginaAtual = 1;
let totalPaginas = 1; 
let ordemAtual = "desc"; 
let filtroEspecie = "todos"; 
let filtroGenero = "todos";
let filtroIdade = "todos";
const LIMITE = 12; 

/**
 * Atualiza o texto "Exibindo: X, Y" na barra mobile
 */
function atualizarTextoExibindo() {
    const statusText = document.querySelector('.exibindo-status strong');
    if (!statusText) return;

    // Pega os textos dos chips ativos, ignorando os valores padrão "todos/novos"
    const filtrosAtivos = Array.from(document.querySelectorAll('.chip.active'))
        .map(chip => chip.innerText.trim())
        .filter(texto => !['todas', 'todos', 'todas as espécies', 'novos', 'todas as idades'].includes(texto.toLowerCase()));

    statusText.innerText = filtrosAtivos.length === 0 ? 'Todos' : filtrosAtivos.join(', ');
}

/**
 * Conta o total de documentos para a paginação baseada nos filtros atuais
 */
async function atualizarTotalPaginas() {
    try {
        let collConstraints = [collection(db, "pets"), where("status", "==", "disponivel")];

        if (filtroEspecie !== "todos") collConstraints.push(where("especie", "==", filtroEspecie));
        if (filtroGenero !== "todos") collConstraints.push(where("genero", "==", filtroGenero));
        if (filtroIdade !== "todos") collConstraints.push(where("idade", "==", filtroIdade));

        const snapshot = await getCountFromServer(query(...collConstraints));
        totalPaginas = Math.ceil(snapshot.data().count / LIMITE) || 1;
    } catch (e) {
        console.error("Erro na contagem:", e);
        totalPaginas = 1;
    }
}

/**
 * Função principal de busca e renderização
 */
async function filtrarPets(direcao = 'inicial') {
    const grid = document.getElementById('grid-pets');
    const loader = document.getElementById('catalog-loader'); 
    if (!grid || !loader) return;

    if (direcao === 'inicial') {
        ultimoDoc = null; primeiroDoc = null; paginaAtual = 1;
        await atualizarTotalPaginas(); 
    }

    loader.style.display = 'flex';
    grid.style.display = 'none'; 

    try { 
        let restricoes = [collection(db, "pets"), where("status", "==", "disponivel")];
        
        if (filtroEspecie !== "todos") restricoes.push(where("especie", "==", filtroEspecie));
        if (filtroGenero !== "todos") restricoes.push(where("genero", "==", filtroGenero));
        if (filtroIdade !== "todos") restricoes.push(where("idade", "==", filtroIdade));

        restricoes.push(orderBy("criadoEm", ordemAtual));

        let q;
        if (direcao === 'proximo' && ultimoDoc) {
            q = query(...restricoes, startAfter(ultimoDoc), limit(LIMITE));
        } else if (direcao === 'anterior' && primeiroDoc) {
            q = query(...restricoes, endBefore(primeiroDoc), limitToLast(LIMITE));
        } else {
            q = query(...restricoes, limit(LIMITE));
        }

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            loader.style.display = 'none'; 
            grid.style.display = 'block';  
            grid.innerHTML = `
                <div class="sem-resultados" style="text-align: center; padding: 50px;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                    <p>Nenhum patudo encontrado com esses filtros. 🐾</p>
                </div>`;
            atualizarInterfacePaginacao();
            return;
        }

        const docs = snapshot.docs;
        primeiroDoc = docs[0];
        ultimoDoc = docs[docs.length - 1];

        if (direcao === 'proximo') paginaAtual++;
        if (direcao === 'anterior') paginaAtual--;

        grid.innerHTML = "";
        docs.forEach(doc => {
            grid.insertAdjacentHTML('beforeend', criarCardPetHTML(doc.data(), doc.id));
        });

        loader.style.display = 'none';
        grid.style.display = 'grid'; 

        atualizarInterfacePaginacao();
        
        setTimeout(() => {
            reveal();
            configurarModal(); 
        }, 100);
        
    } catch (e) { 
        console.error("Erro na busca:", e); 
        loader.style.display = 'none';
        grid.style.display = 'block';
        grid.innerHTML = '<p>Erro ao carregar dados.</p>';
    }
}

function atualizarInterfacePaginacao() {
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    const displayPagina = document.getElementById('numeros-paginas');

    if (displayPagina) {
        displayPagina.innerHTML = `Página <strong style="color: #f2b749;"> ${paginaAtual} </strong> de ${totalPaginas}`;
    }

    if (btnAnterior) btnAnterior.disabled = (paginaAtual === 1);
    if (btnProximo) btnProximo.disabled = (paginaAtual >= totalPaginas);
}

const rolarParaCatalogo = () => {
    const topo = document.getElementById('topo-catalogo') || document.querySelector('.catalogo-container-horizontal');
    if (topo) window.scrollTo({ top: topo.offsetTop - 50, behavior: 'smooth' });
};

/**
 * Garante que se o usuário mudar o filtro no desktop, o mobile também atualize (e vice-versa)
 */
function sincronizarFiltrosVisual() {
    document.querySelectorAll('.chips-group').forEach(grupo => {
        const tipoGrupo = grupo.dataset.group;
        grupo.querySelectorAll('.chip').forEach(botao => {
            const valor = botao.dataset.value;
            botao.classList.remove('active');

            if (tipoGrupo === 'especie' && valor === filtroEspecie) botao.classList.add('active');
            else if (tipoGrupo === 'genero' && valor === filtroGenero) botao.classList.add('active');
            else if (tipoGrupo === 'idade' && valor === filtroIdade) botao.classList.add('active');
            else if (tipoGrupo === 'ordem') {
                const estadoOrdem = (ordemAtual === 'asc') ? 'antigos' : 'novos';
                if (valor === estadoOrdem) botao.classList.add('active');
            }
        });
    });
    atualizarTextoExibindo();
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Tratamento de URL (vindo da Home)
    const params = new URLSearchParams(window.location.search);
    let especieURL = params.get('especie');
    if (especieURL) {
        filtroEspecie = especieURL.charAt(0).toUpperCase() + especieURL.slice(1).toLowerCase();
    }

    sincronizarFiltrosVisual();
    await filtrarPets('inicial');
    window.history.replaceState({}, document.title, window.location.pathname);

   // 2. Eventos de Clique nos Chips
    document.querySelectorAll('.chip').forEach(botao => {
        botao.addEventListener('click', async (e) => {
            const grupo = e.target.closest('.chips-group');
            if (!grupo) return;

            const valor = botao.dataset.value;
            const tipoGrupo = grupo.dataset.group;

            // Sincroniza visualmente (Desktop e Mobile)
            document.querySelectorAll(`.chips-group[data-group="${tipoGrupo}"] .chip`).forEach(b => b.classList.remove('active'));
            document.querySelectorAll(`.chips-group[data-group="${tipoGrupo}"] .chip[data-value="${valor}"]`).forEach(b => b.classList.add('active'));

            // Atualiza as variáveis globais
            if (tipoGrupo === 'ordem') ordemAtual = (valor === 'antigos') ? 'asc' : 'desc';
            else if (tipoGrupo === 'especie') filtroEspecie = valor;
            else if (tipoGrupo === 'genero') filtroGenero = valor;
            else if (tipoGrupo === 'idade') filtroIdade = valor;

            // ATUALIZA O TEXTO NA BARRA
            atualizarTextoStatus();
            
            // Faz a busca no Firebase
            await filtrarPets('inicial');
        });
    });

    // 3. Paginação
    document.getElementById('btn-proximo')?.addEventListener('click', () => {
        if (paginaAtual < totalPaginas) { filtrarPets('proximo'); rolarParaCatalogo(); }
    });
    document.getElementById('btn-anterior')?.addEventListener('click', () => {
        if (paginaAtual > 1) { filtrarPets('anterior'); rolarParaCatalogo(); }
    });

    // 4. Controle Sidefilter Mobile
const sidebar = document.getElementById('sidebar-mobile');
const overlay = document.getElementById('sidebar-overlay');
const btnOpen = document.getElementById('open-filters');
const btnClose = document.getElementById('close-filters');
const btnAplicarMobile = document.getElementById('btn-aplicar-mobile');

// Função para ABRIR
function abrirSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Bloqueia scroll
}

// Função para FECHAR
function fecharSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Libera scroll
}

if (btnOpen) btnOpen.addEventListener('click', abrirSidebar);
if (btnClose) btnClose.addEventListener('click', fecharSidebar);
if (overlay) overlay.addEventListener('click', fecharSidebar);

// No botão Aplicar Mobile
if (btnAplicarMobile) {
    btnAplicarMobile.addEventListener('click', () => {
        fecharSidebar();
        const grid = document.getElementById('grid-pets');
        grid?.classList.add('feedback-loader');
        setTimeout(() => grid?.classList.remove('feedback-loader'), 500);
        
        rolarParaCatalogo();
    });
}

    // Fechar ao clicar fora (Mobile)
    document.addEventListener('click', (e) => {
        if (sidebarFiltros?.classList.contains('active') && !sidebarFiltros.contains(e.target) && e.target !== btnOpenFilters) {
            sidebarFiltros.classList.remove('active');
        }
    });

    configurarModal();
    configurarLightbox();
});

function atualizarTextoStatus() {
    // 1. Tenta encontrar os elementos de destino
    const statusMobile = document.querySelector('#status-filtro-mobile strong') || document.querySelector('.filter-bar .exibindo-status strong');
    const statusDesktop = document.querySelector('.barra-filtros-topo .exibindo-status strong');

    // 2. Pega os textos dos chips ativos, ignorando os "Todos"
    const filtrosAtivos = Array.from(document.querySelectorAll('.sidebar-filtros .chip.active, .barra-filtros-topo .chip.active'))
        .map(chip => chip.innerText.trim())
        .filter(texto => !['todas', 'todos', 'todas as espécies', 'novos', 'todas as idades', 'todas'].includes(texto.toLowerCase()));

    // Remove duplicatas (já que temos chips no mobile e desktop)
    const filtrosUnicos = [...new Set(filtrosAtivos)];
    
    const textoFinal = filtrosUnicos.length === 0 ? 'Todos' : filtrosUnicos.join(', ');

    // 3. Aplica o texto nos dois lugares se eles existirem
    if (statusMobile) statusMobile.innerText = textoFinal;
    if (statusDesktop) statusDesktop.innerText = textoFinal;
}