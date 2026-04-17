const URL_LOGO_PADRAO = "SUA_URL_DA_LOGO_AQUI";
const URL_PET_PADRAO = "SUA_URL_DA_SILHUETA_PET_AQUI";

export function formatarDataBR(dataISO) {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// CRIAR CARDS
export function criarCardPetHTML(pet, id) {
    const textoDescricao = pet.descricao || pet.desc || 'Sem descrição disponível.';
    let fotoExibicao = pet.fotoUrl || 'assets/branding/logo.jpg'; 
    
    if (fotoExibicao.includes('cloudinary.com')) {
        fotoExibicao = fotoExibicao.replace('/upload/', '/upload/f_auto,q_auto,w_1200,c_limit/');
    }

    return `
        <article class="pet-card reveal active">
            <div class="pet-image-container">
                <img src="${fotoExibicao}" alt="${pet.nome}" loading="lazy">
            </div>
            <div class="pet-info">
                <h3>${pet.nome}</h3>
                <p class="pet-specs">${pet.especie} • ${pet.genero} • ${pet.idade}</p>
                <p class="pet-desc">${textoDescricao}</p>
                <div class="card-actions">
                    <button class="btn-ler-mais btn-conhecer" 
                        data-nome="${pet.nome}" 
                        data-especie="${pet.especie}" 
                        data-genero="${pet.genero}" 
                        data-idade="${pet.idade}" 
                        data-descricao="${textoDescricao}" 
                        data-imagem="${fotoExibicao}">
                        Conhecer
                    </button>
                    <button class="btn-wpp-small" onclick="contatoWhatsApp('${pet.nome}')">ADOTAR 🐾</button>
                </div>
            </div>
        </article>`;
}

// CRIAR CARDS MURAL DE EVENTOS
export function criarCardMuralHTML(id, dados) {
    const dataBR = formatarDataBR(dados.dataISO);
    
    return `
        <article class="mural-card reveal">
            <div class="mural-card-header">
                <img src="${dados.fotoUrl || URL_LOGO_PADRAO}" alt="Evento">
            </div>
            <div class="mural-card-content">
                <span class="mural-tag">PRÓXIMO EVENTO</span>
                <h3 class="mural-title">${dados.titulo}</h3>
                <div class="mural-info-row">
                    <span><i class="fas fa-calendar-alt"></i>${dataBR} </span>
                    <span>•</span>
                    <span><i class="fa-solid fa-clock"></i>${dados.hora}</span>
                </div>
                <p class="mural-description">${dados.descricao}</p>
                <button class="btn-detalhes" onclick="abrirModalEvento('${id}')">
                    SAIBA MAIS
                </button>
            </div>
        </article>
    `;
}

// LÓGICA DO MODAL DE EVENTOS
export function criarConteudoEventoHTML(dados, id) {
    const dataBR = formatarDataBR(dados.dataISO);
    const querySegura = `${dados.endereco}, Joinville - SC`;
    
    let fotoUrl = dados.fotoUrl || URL_LOGO_PADRAO;
    if (fotoUrl.includes('cloudinary.com')) {
        fotoUrl = fotoUrl.replace('/upload/', '/upload/w_1000,q_auto,f_auto/');
    }

    return `
        <div class="modal-header-img">
            <img src="${fotoUrl}" alt="${dados.titulo}">
        </div>
        <div class="modal-body">
            <h2 class="modal-title">${dados.titulo}</h2>
            
            <div class="modal-info-grid">
                <div class="info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <strong>Data:</strong>
                        <span>${dataBR}</span>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <div>
                        <strong>Horário:</strong>
                        <span>${dados.hora}</span>
                    </div>
                </div>
            </div>

            <div class="modal-location-box">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <strong>Localização</strong>
                    <p>${dados.endereco}</p>
                </div>
            </div>

            <div class="modal-description">
                <h3>Sobre o evento</h3>
                <p>${dados.descricao}</p>
            </div>

            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(querySegura)}" 
               target="_blank" class="btn-primary-modal">
                <i class="fas fa-directions"></i> VER NO MAPS
            </a>
        </div>
    `;
}

export function configurarModal(idContainer = 'grid-pets') {
    const modalPet = document.getElementById('modal-pet');
    const grid = document.getElementById(idContainer);

    if (!modalPet || !grid) return;

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-ler-mais'); 
        if (!btn) return;

        const d = btn.dataset;

        const imgElement = modalPet.querySelector('.modal-header-image img');
        if (imgElement) {
            imgElement.src = d.imagem;
            imgElement.alt = `Foto do ${d.nome}`;
        }

        modalPet.querySelector('.pet-name').innerText = d.nome;
        modalPet.querySelector('.pet-meta').innerText = `${d.especie} • ${d.genero} • ${d.idade}`;
        modalPet.querySelector('.pet-description p').innerText = d.descricao;

        modalPet.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    });

    modalPet.onclick = (e) => {
        if (e.target.classList.contains('close-modal') || e.target === modalPet) {
            modalPet.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    };
}

// --- LÓGICA DO LIGHTBOX (CLICAR NA IMAGEM) ---
export function configurarLightbox() {
    const lightbox = document.getElementById('lightbox-pet');
    const lightboxImg = lightbox?.querySelector('.lightbox-img');

    if (!lightbox || !lightboxImg) return;

    document.addEventListener('click', (e) => {
        const imgModal = e.target.closest('.modal-header-image img');
        
        if (imgModal) {
            lightboxImg.src = imgModal.src;
            lightbox.classList.add('active');
        }

        if (e.target.classList.contains('close-lightbox') || e.target === lightbox) {
            lightbox.classList.remove('active');
            lightboxImg.src = ""; 
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            lightboxImg.src = "";
        }
    });
}

export function reveal() {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;
        const elementVisible = 100;

        if (elementTop < windowHeight - elementVisible) {
            el.classList.add("active");
        }
    });
}

window.contatoWhatsApp = (nome) => {
    const msg = encodeURIComponent(`Olá! Vi o(a) ${nome} no site e gostaria de saber mais sobre o processo de adoção.`);
    window.open(`https://wa.me/47989134439?text=${msg}`, '_blank');
};