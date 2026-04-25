import { auth, CLOUDINARY_CONFIG, URL_LOGO_PADRAO } from './firebase-config.js';
import { DataService } from '../service/data-service.js';
import { verificarAutenticacao, realizarLogout } from './auth.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

async function carregarListaPets() {
    try {
        // Usando o novo DataService - abstração completa do Firebase
        const pets = await DataService.buscarTodos("pets", {
            ordenacao: [{ campo: "criadoEm", direcao: "desc" }]
        });
        
        // renderiza os pets na tela...
        // Exemplo: pets.forEach(pet => { /* lógica de renderização */ });
        console.log("Pets carregados:", pets);
    } catch (error) {
        console.error("Erro ao carregar lista de pets:", error);
    }
}

// 1. Segurança e Logout
verificarAutenticacao();
document.getElementById('btn-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    realizarLogout();
});

// ============================================================
//         FUNÇÕES DE SEGURANÇA
// ============================================================

// Função para permitir apenas letras, números e espaços
const sanitizeInput = (inputElement) => {
    inputElement.addEventListener('input', (e) => {
        // Regex: permite letras (a-z, A-Z), números (0-9), espaços (\s) e acentos comuns
        const safeValue = e.target.value.replace(/[^a-zA-Z0-9\sÀ-ÿ]/g, "");
        
        if (e.target.value !== safeValue) {
            e.target.value = safeValue;
        }
    });
};

// Aplicação nos campos (Exemplos de IDs)
const petNome = document.getElementById('pet-nome');
const tituloEvento = document.getElementById('mural-titulo');
const petDesc = document.getElementById('pet-desc');
const muralDesc = document.getElementById('mural-desc');



if (petNome) sanitizeInput(petNome);
if (petDesc) sanitizeInput(petDesc);


if (tituloEvento) sanitizeInput(tituloEvento);
if (muralDesc) sanitizeInput(muralDesc);

// Função de Segurança para o ENDEREÇO DO EVENTO
const enderecoInput = document.getElementById('mural-endereco');

enderecoInput?.addEventListener('input', (e) => {
    // Permite: Letras, Números, Espaços, Vírgulas, Hifens e Pontos.
    // Bloqueia: < > / \ ; : ( ) [ ] { } etc.
    const safeAddress = e.target.value.replace(/[^a-zA-Z0-9\sÀ-ÿ,.-]/g, "");
    
    if (e.target.value !== safeAddress) {
        e.target.value = safeAddress;
    }
});



// Função de validação - SOMENTE IMAGEM NO UPLOAD
const uploadInput = document.getElementById('upload-imagem');

uploadInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file) {
        // 1. Validar Tipo de Arquivo (MIME Type)
        if (!allowedTypes.includes(file.type)) {
            alert("Formato inválido! Apenas JPG, PNG ou WEBP são permitidos.");
            e.target.value = ""; // Limpa o campo
            return;
        }

        // 2. Validar Tamanho (Ex: Máximo 2MB para performance do Admin)
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("Arquivo muito grande! O limite é de 2MB.");
            e.target.value = "";
            return;
        }
        
        console.log("Arquivo validado e pronto para upload.");
    }
});

// ============================================================
//  FUNÇÃO AUXILIAR DE UPLOAD (CLOUDINARY)
// ============================================================
async function subirParaCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) throw new Error("Falha no upload para Cloudinary");
    const data = await res.json();
    return data.secure_url;
}

// ============================================================
//  NAVEGAÇÃO E PREVIEWS
// ============================================================
window.showTab = function(tabId) {
    const dash = document.getElementById('dashboard-home');
    if (dash) dash.style.display = 'none';
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }
};

const mapeamento = {
    // Preview Pet
    'pet-nome': 'p-nome',
    'pet-especie': 'p-especie',
    'pet-genero': 'p-genero',
    'pet-idade': 'p-idade',
    'pet-desc': 'p-desc',

    // Preview Mural 
    'mural-titulo': 'p-mural-title',
    'mural-data': 'p-mural-date',
    'mural-hora': 'p-mural-time',
    'mural-desc': 'p-mural-description'
};

const placeholders = {
    'p-nome': 'Nome do Patudo',
    'p-especie': 'Espécie',
    'p-genero': 'Gênero',
    'p-idade': 'Idade/Fase',
    'p-desc': 'A história do pet aparecerá aqui...',

    'p-mural-title': 'Título do Evento',
    'p-mural-date': 'Data do Evento',
    'p-mural-time': 'Hora do Evento',
    'p-mural-description': 'A descrição aparecerá aqui...'
};

function formatarDataBR(dataISO) {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function iniciarMapeamentoPreviews() {
    Object.keys(mapeamento).forEach(idInput => {
    const inputEl = document.getElementById(idInput);
    const idPreview = mapeamento[idInput];
    const previewEl = document.getElementById(idPreview);

    if (inputEl && previewEl) {
        const evento = (inputEl.type === 'date' || inputEl.type === 'time' || inputEl.tagName === 'SELECT') 
                       ? 'change' 
                       : 'input';
        
        inputEl.addEventListener(evento, () => {
            let valor = inputEl.value;

            if (idInput === 'mural-data') {
                valor = formatarDataBR(inputEl.value);
            }
    
            previewEl.textContent = valor || placeholders[idPreview];
        });

        // Adiciona 'input' também na data para navegadores que permitem digitar
        if (evento === 'change') {
            inputEl.addEventListener('input', () => {
                previewEl.textContent = inputEl.value || placeholders[idPreview];
            });
        }
    }
});
}
let cropperMural = null;
const fileInputMural = document.getElementById('mural-foto');
const imageToCropMural = document.getElementById('image-to-crop-mural');
const cropContainerMural = document.getElementById('crop-container-mural');

fileInputMural?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imageToCropMural.src = event.target.result;
            cropContainerMural.style.display = 'block';

            if (cropperMural) cropperMural.destroy();

            cropperMural = new Cropper(imageToCropMural, {
                aspectRatio: 1, // Formato retangular para banners
                viewMode: 1,
                autoCropArea: 1,
                crop() {
                    const canvas = cropperMural.getCroppedCanvas({ width: 1280, height: 720 });
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    // Atualiza o preview lateral do mural
                    document.getElementById('p-mural-img').src = dataUrl;
                    document.getElementById('form-mural-img-preview').src = dataUrl;
                }
            });
        };
        reader.readAsDataURL(file);
    }
});

// Botões de controle do Mural
document.getElementById('btn-zoom-in-mural')?.addEventListener('click', () => cropperMural?.zoom(0.1));
document.getElementById('btn-zoom-out-mural')?.addEventListener('click', () => cropperMural?.zoom(-0.1));
document.getElementById('btn-reset-mural')?.addEventListener('click', () => cropperMural?.reset());


// --- NOVA LÓGICA COM CROPPER.JS ---
let cropper = null; // Variável global para controlar a instância
const fileInput = document.getElementById('pet-foto');
const imageToCrop = document.getElementById('image-to-crop'); // O <img> que você criou no HTML
const cropContainer = document.getElementById('crop-container');

fileInput?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            // 1. Atribui a imagem ao elemento <img>
            imageToCrop.src = event.target.result;
            
            // 2. Mostra o container
            cropContainer.style.display = 'block';

            // 3. Se já existir um cropper ativo, destrói para criar um novo
            if (cropper) {
                cropper.destroy();
            }

            // 4. Inicializa o Cropper
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1, // Mantém o corte quadrado
                viewMode: 1,    // Impede que o corte saia para fora da imagem
                autoCropArea: 1,
                dragMode: 'move',
                crop() {
                    // Gera o preview em tempo real nos cards enquanto você corta
                    const canvasResult = cropper.getCroppedCanvas({ width: 300, height: 300 });
                    const dataUrl = canvasResult.toDataURL('image/jpeg');
                    
                    // Atualiza os previews que você já tem no seu código
                    document.getElementById('p-img').src = dataUrl;
                    document.getElementById('form-img-preview').src = dataUrl;
                }
            });
        };
        reader.readAsDataURL(file);
    } else {
        cropContainer.style.display = 'none';
        if (cropper) cropper.destroy();
    }
});

// Ajuste nos botões de Zoom (aproveitando os IDs que você já tem)
document.getElementById('btn-zoom-in')?.addEventListener('click', () => cropper?.zoom(0.1));
document.getElementById('btn-zoom-out')?.addEventListener('click', () => cropper?.zoom(-0.1));
document.getElementById('btn-reset-crop')?.addEventListener('click', () => cropper?.reset());
//=====================================================


// Previews de Imagem (Leitura Local para feedback imediato)
function configurarPreview(inputId, imgIds, containerId) {
    document.getElementById(inputId)?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imgIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.src = event.target.result;
                });
                if (containerId) document.getElementById(containerId).style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });
}
configurarPreview('pet-foto', ['p-img', 'form-img-preview'], 'pet-foto-preview-container');
configurarPreview('mural-foto', ['p-mural-img', 'form-mural-img-preview'], 'mural-foto-preview-container');

// Função para o preview de imagem do Mural
function configurarPreviewMural() {
    const inputFotoMural = document.getElementById('mural-foto'); // ID do input file no form
    const imgPreviewMural = document.getElementById('p-mural-img'); // ID da img no aside

    // Verifica se os elementos existem para não dar erro
    if (!inputFotoMural || !imgPreviewMural) return;

    inputFotoMural.addEventListener('change', function() {
        // Se um arquivo foi selecionado
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            // Quando a leitura do arquivo terminar
            reader.onload = function(e) {
                // Atualiza o src da imagem com o conteúdo lido (Base64 temporário)
                imgPreviewMural.src = e.target.result;
            }

            // Lê o arquivo como URL de dados (Base64)
            reader.readAsDataURL(this.files[0]);
        }
    });
}

document.addEventListener('DOMContentLoaded', configurarPreviewMural);

// ============================================================
//  GESTÃO DE PETS (ESCUTA E CADASTRO)
// ============================================================
const tabelaPets = document.getElementById('lista-pets-admin');

// Painel de Pets Ativos
function iniciarEscutaPetsAdmin() {
    if (!tabelaPets) return;

    // Usando DataService para escutar mudanças em tempo real nos pets
    const unsubscribe = DataService.escutarColecao("pets", (pets) => {
        tabelaPets.innerHTML = "";
        pets.forEach((pet) => {
            const id = pet.id;

            // Definir o status visual
            const isAdotado = pet.status === 'adotado';
            const statusLabel = isAdotado ? 'Adotado' : 'Disponível';
            const statusClass = isAdotado ? 'status-adotado' : 'status-disponivel';

            const novaLinha = document.createElement('tr');
            novaLinha.className = 'admin-pet-row'; // Classe para o CSS

            novaLinha.innerHTML = `
                <td>
                    <div class="pet-info-cell">
                        <img src="${pet.fotoUrl}" class="pet-thumb-admin" alt="${pet.nome}">
                        <div>
                            <strong class="pet-name">${pet.nome}</strong>
                            <span class="pet-subtitle">${pet.especie} • ${pet.genero} • ${pet.idade}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-pill ${statusClass}">${statusLabel}</span>
                </td>
                <td class="acoes-cell">
                    <div class="actions-wrapper">
                        <button class="btn-action adotado"
                                onclick="confirmarAdocao('${id}')"
                                title="Marcar como Adotado"
                                ${isAdotado ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="btn-action delete"
                                onclick="removerPetDoBanco('${id}', '${pet.nome}')"
                                title="Excluir Registro">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            tabelaPets.appendChild(novaLinha);
        });
    }, {
        ordenacao: [{ campo: "criadoEm", direcao: "desc" }]
    });
}
iniciarEscutaPetsAdmin();

// Lógica de confirmação para adoção.
window.confirmarAdocao = (petId) => {
    // Se não houver petId (chamada acidental no load), não faz nada
    if (!petId) return;

    // Usando seu modal personalizado
    window.mostrarAviso({
        titulo: "Confirmar Adoção",
        mensagem: "Deseja marcar este pet como adotado? Isso atualizará as estatísticas do site.",
        icone: "🐾",
        showCancel: true,
        onConfirm: async () => {
            try {
                // Usando DataService para transação
                await DataService.executarTransacao(async (batch, { doc, increment }) => {
                    const petRef = doc(db, "pets", petId);
                    const estatisticasRef = doc(db, "estatisticas", "geral");

                    // Verificar se estatísticas existem
                    const estatisticas = await DataService.buscarPorId("estatisticas", "geral");
                    if (!estatisticas) {
                        await DataService.criar("estatisticas", { 
                            id: "geral", 
                            disponiveis: 0, 
                            totalAdotados: 0, 
                            adotadosMes: 0 
                        });
                    }

                    batch.delete(petRef);
                    batch.update(estatisticasRef, {
                        totalAdotados: increment(1),
                        adotadosMes: increment(1),
                        disponiveis: increment(-1)
                    });
                });

                // Aviso de sucesso também personalizado
                window.mostrarAviso({ 
                    titulo: "Parabéns!", 
                    mensagem: "Mais uma vida salva! Os contadores foram atualizados.", 
                    icone: "🎉",
                    showCancel: false 
                });
            } catch (error) {
                console.error("Erro:", error);
                window.mostrarAviso({ 
                    titulo: "Erro", 
                    mensagem: "Não foi possível atualizar o banco de dados.", 
                    icone: "❌",
                    showCancel: false 
                });
            }
        }
    });
};

//          FUNÇÃO DE SUBMIT
const formPet = document.getElementById('form-cadastrar-pet');
formPet?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');

    // --- NOVA LÓGICA DE CAPTURA DO CROPPER ---
    if (!cropper) {
        return window.mostrarAviso({ titulo: "Atenção", mensagem: "Por favor, selecione e ajuste uma foto do pet.", icone: "📸" });
    }

    // Gera o canvas do corte final com alta qualidade
    const canvasFinal = cropper.getCroppedCanvas({ 
        width: 800, 
        height: 800,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });

    // Converte o canvas para Blob (arquivo binário)
    const croppedBlob = await new Promise(resolve => canvasFinal.toBlob(resolve, 'image/jpeg', 0.9));

    if (!croppedBlob) {
        return window.mostrarAviso({ titulo: "Erro", mensagem: "Falha ao processar imagem.", icone: "❌" });
    }

    const fotoCortadaFile = new File([croppedBlob], "pet_foto.jpg", { type: 'image/jpeg' });
    // ---------------------------------------

    try {
        btn.disabled = true;
        btn.innerText = "Cadastrando Pet... ⏳";

        // 1. Upload Cloudinary (Sua função original)
        const urlCloudinary = await subirParaCloudinary(fotoCortadaFile);

        // 2. Montagem dos dados (Mantendo sua estrutura)
        const petData = {
            nome: document.getElementById('pet-nome').value,
            especie: document.getElementById('pet-especie').value,
            genero: document.getElementById('pet-genero').value,
            idade: document.getElementById('pet-idade').value,
            descricao: document.getElementById('pet-desc').value,
            status: "disponivel",
            fotoUrl: urlCloudinary
        };

        // 3. Gravação no Firestore usando DataService
        await DataService.criar("pets", petData);

        // 4. Atualiza o contador de pets disponíveis usando DataService
        const estatisticas = await DataService.buscarPorId("estatisticas", "geral");
        if (estatisticas) {
            await DataService.atualizar("estatisticas", "geral", {
                disponiveis: (estatisticas.disponiveis || 0) + 1
            });
        } else {
            await DataService.criar("estatisticas", {
                id: "geral",
                disponiveis: 1,
                totalAdotados: 0,
                adotadosMes: 0
            });
        }

        // 5. Chama a função que atualiza os números na tela do admin
        if (typeof carregarEstatisticasAdmin === "function") {
            carregarEstatisticasAdmin();
        }
        
        // 4. SUCESSO E RESET
        formPet.reset();
        window.limparPrevia('pet');
        
        // Destruir o cropper e esconder o container após salvar
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        cropContainer.style.display = 'none';
        
        window.mostrarAviso({ titulo: "Sucesso!", mensagem: "Pet cadastrado!", icone: "✅" });
        
    } catch (error) {
        console.error("Erro no cadastro:", error);
        window.mostrarAviso({ titulo: "Erro", mensagem: "Não foi possível salvar.", icone: "❌" });
    } finally {
        btn.disabled = false;
        btn.innerText = "Cadastrar Pet";
    }
});

function configurarLimitesDataHora() {
    const inputData = document.getElementById('mural-data');
    const inputHora = document.getElementById('mural-hora');
    
    // 1. Bloqueia datas retroativas no calendário
    const hoje = new Intl.DateTimeFormat('fr-CA').format(new Date()); // Formato YYYY-MM-DD
    inputData.setAttribute('min', hoje);

    // 2. Validação dinâmica para a hora
    inputData.addEventListener('change', () => {
        validarHorario();
    });

    inputHora.addEventListener('input', () => {
        validarHorario();
    });

    function validarHorario() {
        const agora = new Date();
        const dataSelecionada = inputData.value;
        
        // Se a data for hoje, precisa validar a hora
        if (dataSelecionada === hoje) {
            const horaAtual = agora.getHours().toString().padStart(2, '0');
            const minutoAtual = agora.getMinutes().toString().padStart(2, '0');
            const horarioMinimo = `${horaAtual}:${minutoAtual}`;
            
            if (inputHora.value && inputHora.value < horarioMinimo) {
                // Se a hora for menor que a atual, reseta e avisa
                inputHora.value = ""; 
                // Sistema de mensagem customizada aqui em vez de alert
                console.log("Não é possível selecionar um horário que já passou para hoje.");
            }
        }
    }
}

configurarLimitesDataHora();

// ============================================================
//  GESTÃO DO MURAL DE EVENTOS ATIVOS
// ============================================================
const containerGrid = document.getElementById('lista-mural-admin');

async function iniciarEscutaMural() {
    if (!containerGrid) return;

    const DIAS_DE_RETENCAO = 7; // Definição da data de corte.
    // LÓGICA DE LIMPEZA AUTOMÁTICA (Executa apenas uma vez ao abrir o painel)
    try {
        const hojeLimpeza = new Date();
        hojeLimpeza.setDate(hojeLimpeza.getDate() - DIAS_DE_RETENCAO);
        const dataCorteISO = hojeLimpeza.toISOString().split('T')[0];

        // Buscar banners antigos usando DataService
        const bannersAntigos = await DataService.buscarComFiltro("banners", "dataISO", "<", dataCorteISO);

        if (bannersAntigos.length > 0) {
            // Deletar cada banner antigo
            for (const banner of bannersAntigos) {
                await DataService.deletar("banners", banner.id);
            }
            console.log(`Auto-Cleanup: ${bannersAntigos.length} eventos antigos removidos.`);
        }
    } catch (error) {
        console.error("Erro na limpeza automática:", error);
    }

    // Usando DataService para escutar mudanças no mural
    const unsubscribe = DataService.escutarColecao("banners", (banners) => {
        containerGrid.innerHTML = "";

        if (banners.length === 0) {
            containerGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-image"></i>
                    <p>Nenhum banner ativo no momento.</p>
                </div>`;
            return;
        }

        banners.forEach((banner) => {
            const hoje = new Intl.DateTimeFormat('fr-CA').format(new Date());

            const estaExpirado = banner.dataISO < hoje;

            const statusTexto = estaExpirado ? "Inativo (Encerrado)" : "Ativo no Site";
            const statusCor = estaExpirado ? "#e74c3c" : "#2ecc71";

            const novoCard = document.createElement('div');
            novoCard.className = 'admin-banner-card';
            novoCard.innerHTML = `
                <div class="banner-preview">
                    <img src="${banner.fotoUrl}" alt="Banner" style="${estaExpirado ? 'filter: grayscale(1);' : ''}">
                    <span class="status-badge" style="background: ${statusCor}">${statusTexto}</span>
                </div>
                <div class="banner-info">
                    <div class="text-content">
                        <h4>${banner.titulo}</h4>
                        <p>Data do Evento: ${banner.dataISO.split('-').reverse().join('/')}</p>
                    </div>
                    <button type="button" class="btn-delete-minimal" onclick="removerBannerDoBanco('${banner.id}')" title="Excluir Evento">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            containerGrid.appendChild(novoCard);
        });
    }, {
        ordenacao: [{ campo: "dataISO", direcao: "desc" }]
    });
}
iniciarEscutaMural();

// === GESTÃO DO MURAL (SUBMIT COM FOTO PADRÃO) ===
const formMural = document.getElementById('form-mural');

formMural?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const enderecoLimpo = document.getElementById('mural-endereco').value.trim();
    
    if (enderecoLimpo.length < 5) {
        return window.mostrarAviso({ 
            titulo: "Endereço", 
            mensagem: "Por favor, informe um endereço completo para o GPS.", 
            icone: "📍",
            showCancel: false 
        });
    }

    const btn = e.target.querySelector('button[type="submit"]');

    try {
        btn.disabled = true;
        btn.innerText = "Publicando... ⏳";

        let urlFinalParaOBanco = URL_LOGO_PADRAO;

        // --- LÓGICA DO CROPPER QUADRADO (1:1) ---
        if (cropperMural) {
            // Ajustado para 800x800 (proporção idêntica ao pet)
            const canvasFinal = cropperMural.getCroppedCanvas({ 
                width: 800, 
                height: 800,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            const croppedBlob = await new Promise(resolve => canvasFinal.toBlob(resolve, 'image/jpeg', 0.8));
            const fotoArquivo = new File([croppedBlob], "mural_arte.jpg", { type: 'image/jpeg' });
            
            urlFinalParaOBanco = await subirParaCloudinary(fotoArquivo);
            console.log("Upload de arte quadrada concluído:", urlFinalParaOBanco);
        } else {
            console.log("Usando logo padrão (Nenhuma arte selecionada).");
        }

        // --- GRAVAÇÃO NO FIRESTORE usando DataService ---
        await DataService.criar("banners", {
            titulo: document.getElementById('mural-titulo').value,
            dataISO: document.getElementById('mural-data').value,
            hora: document.getElementById('mural-hora').value,
            endereco: enderecoLimpo,
            descricao: document.getElementById('mural-desc').value,
            fotoUrl: urlFinalParaOBanco,
            criadoEm: new Date()
        });

        // --- LIMPEZA PÓS-SUCESSO ---
        formMural.reset();
        
        // Importante: Destruir o cropper e esconder o container
        if (cropperMural) {
            cropperMural.destroy();
            cropperMural = null;
        }
        const cropContainer = document.getElementById('crop-container-mural');
        if (cropContainer) cropContainer.style.display = 'none';

        window.limparPrevia('mural'); 
        window.mostrarAviso({ titulo: "Sucesso!", mensagem: "Banner adicionado ao Mural!", icone: "✅" });

    } catch (error) {
        console.error("Erro no mural:", error);
        window.mostrarAviso({ 
            titulo: "Erro!", 
            mensagem: "Não foi possível publicar no mural. Verifique sua conexão.", 
            icone: "❌",
            showCancel: false 
        });
    } finally {
        btn.disabled = false;
        btn.innerText = "ADICIONAR AO MURAL";
    }
});

// ============================================================
//  FUNÇÕES GLOBAIS (DELETE, ALERTAS, RESETS)
// ============================================================

window.removerPetDoBanco = (id, nome) => {
    window.mostrarAviso({
        titulo: "Excluir", mensagem: `Remover ${nome} permanentemente?`, icone: "⚠️", showCancel: true,
        onConfirm: async () => { await deleteDoc(doc(db, "pets", id)); }
    });
};

window.removerBannerDoBanco = (id) => {
    window.mostrarAviso({
        titulo: "Excluir", mensagem: "Remover este evento?", icone: "🗑️", showCancel: true,
        onConfirm: async () => { await deleteDoc(doc(db, "banners", id)); }
    });
};

window.limparPrevia = function(tipo, manterTextos = false) {
    const isMural = tipo === 'mural';
    const pixelTransparente = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    // 1. Limpa o input de arquivo
    const input = document.getElementById(isMural ? 'mural-foto' : 'pet-foto');
    if (input) input.value = "";

    // --- NOVA LÓGICA PARA O CROPPER ---
    if (!isMural) { // O Cropper no momento está apenas nos Pets
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        const cropContainer = document.getElementById('crop-container');
        if (cropContainer) cropContainer.style.display = 'none';
        
        const imageToCrop = document.getElementById('image-to-crop');
        if (imageToCrop) imageToCrop.src = "";
    }
    // ----------------------------------

    // 2. Limpa a miniatura do formulário e volta o card para a logo padrão
    const imgPreview = document.getElementById(isMural ? 'form-mural-img-preview' : 'form-img-preview');
    const imgCard = document.getElementById(isMural ? 'p-mural-img' : 'p-img'); 
    
    if (imgPreview) imgPreview.src = ""; 
    if (imgCard) {
        // Se for mural, volta para a logo padrão. Se for pet, mantém transparente.
        imgCard.src = isMural ? URL_LOGO_PADRAO : pixelTransparente;
    }

    // 3. Esconde o container da miniatura original (o que mostrava a foto antes do cropper)
    const containerOriginal = document.getElementById(isMural ? 'mural-foto-preview-container' : 'pet-foto-preview-container');
    if (containerOriginal) containerOriginal.style.display = 'none';

    if (manterTextos) return; 

    const placeholdersParaResetar = isMural ? {
        'p-mural-title': placeholders['p-mural-title'],
        'p-mural-date': placeholders['p-mural-date'],
        'p-mural-time': placeholders['p-mural-time'],
        'p-mural-description': placeholders['p-mural-description']
    } : {
        'p-nome': placeholders['p-nome'],
        'p-especie': placeholders['p-especie'],
        'p-genero': placeholders['p-genero'],
        'p-idade': placeholders['p-idade'], 
        'p-desc': placeholders['p-desc']
    };

    Object.keys(placeholdersParaResetar).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = placeholdersParaResetar[id];
    });
};

// Modal de Alerta Customizado
let acaoConfirmada = null;
window.mostrarAviso = function(config) {
    const modal = document.getElementById('custom-confirm');
    document.getElementById('modal-title').innerText = config.titulo || "Aviso";
    document.getElementById('confirm-message').innerText = config.mensagem;
    document.getElementById('modal-icon').innerText = config.icone || "⚠️";
    document.getElementById('confirm-cancel').style.display = config.showCancel ? "block" : "none";
    acaoConfirmada = config.onConfirm || null;
    modal.style.display = 'flex';
};

document.getElementById('confirm-ok').onclick = () => {
    if (acaoConfirmada) acaoConfirmada();
    document.getElementById('custom-confirm').style.display = 'none';
};
document.getElementById('confirm-cancel').onclick = () => {
    document.getElementById('custom-confirm').style.display = 'none';
};

const loginForm = document.getElementById('form-login');
loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, loginForm.email.value, loginForm.password.value)
        .then(() => window.location.href = "admin.html")
        .catch(err => alert("Erro: " + err.message));
});

async function carregarEstatisticasAdmin() {
    try {
        // 1. Busca Pets Ativos e Adotados (Documento Geral) usando DataService
        const dados = await DataService.buscarPorId("estatisticas", "geral");

        if (dados) {
            document.querySelectorAll('.counter').forEach(el => {
                const target = el.getAttribute('data-target');
                const valorFinal = dados[target] || 0;
                animarAdmin(el, valorFinal);
            });
        }

        // 2. Busca Eventos Ativos (Contagem real na coleção banners) usando DataService
        const hojeISO = new Intl.DateTimeFormat('fr-CA').format(new Date());
        const eventosAtivos = await DataService.contar("banners", [
            { campo: "dataISO", operador: ">=", valor: hojeISO }
        ]);
        const elEventos = document.getElementById('count-eventos');

        if (elEventos) {
            animarAdmin(elEventos, eventosAtivos);
        }
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

// Função de animação para os números subirem
function animarAdmin(elemento, valorFinal) {
    let start = 0;
    const duration = 2000;
    const step = (valorFinal / (duration / 16));
    
    const animate = () => {
        start += step;
        if (start < valorFinal) {
            elemento.innerText = Math.ceil(start);
            requestAnimationFrame(animate);
        } else {
            elemento.innerText = valorFinal;
        }
    };
    animate();
}


// Inicializadores
document.addEventListener('DOMContentLoaded', () => {
    iniciarMapeamentoPreviews();
    configurarPreviewMural(); 
    carregarEstatisticasAdmin();
});