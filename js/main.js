import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { criarCardPetHTML, criarCardMuralHTML, criarConteudoEventoHTML, configurarModal, configurarLightbox, reveal } from './utils.js';

function carregarMural() {
    const gridMural = document.getElementById('grid-mural');
    const sliderContainer = document.querySelector('.mural-slider-container');
    const sliderLeft = document.getElementById('slider-left');
    const sliderRight = document.getElementById('slider-right');
    if (!gridMural) return;

    // Variáveis para controlar o slider
    let currentIndex = 0;
    let totalEvents = 0;
    let eventsPerView = getEventsPerView();
    let cardWidth = getCardWidth();

    // Função para determinar quantos eventos mostrar por view baseado na tela
    function getEventsPerView() {
        if (window.innerWidth <= 768) return 1; // Mobile: 1 evento por vez
        if (window.innerWidth <= 1024) return 2; // Tablet: 2 eventos por vez
        return 3; // Desktop: 3 eventos por vez
    }

    // Função para obter a largura do card baseado na tela
    function getCardWidth() {
        if (window.innerWidth <= 480) return 260 + 15; // 260px card + 15px gap
        if (window.innerWidth <= 768) return 280 + 20; // 280px card + 20px gap
        if (window.innerWidth <= 1024) return 280 + 30; // 280px card + 30px gap
        return 320 + 40; // 320px card + 40px gap
    }

    // Função para atualizar eventsPerView quando a tela muda
    function updateEventsPerView() {
        const newEventsPerView = getEventsPerView();
        const newCardWidth = getCardWidth();
        
        if (newEventsPerView !== eventsPerView || newCardWidth !== cardWidth) {
            eventsPerView = newEventsPerView;
            cardWidth = newCardWidth;
            // Reset para primeira posição quando muda o layout
            currentIndex = 0;
            updateSliderPosition();
            updateButtonsVisibility();
        }
    }

    // Listener para resize da janela
    window.addEventListener('resize', updateEventsPerView);

    // Variáveis para touch/swipe
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;

    // Função para atualizar a posição do slider
    function updateSliderPosition() {
        const translateX = -currentIndex * cardWidth;
        gridMural.style.transform = `translateX(${translateX}px)`;
    }

    // Função para mostrar/ocultar botões e sombras
    function updateButtonsVisibility() {
        if (totalEvents <= eventsPerView) {
            sliderLeft.style.display = 'none';
            sliderRight.style.display = 'none';
            sliderContainer.classList.remove('show-shadow-left', 'show-shadow-right');
        } else {
            sliderLeft.style.display = currentIndex > 0 ? 'flex' : 'none';
            sliderRight.style.display = currentIndex < totalEvents - eventsPerView ? 'flex' : 'none';
            
            // Controlar sombras
            sliderContainer.classList.toggle('show-shadow-left', currentIndex > 0);
            sliderContainer.classList.toggle('show-shadow-right', currentIndex < totalEvents - eventsPerView);
        }
    }

    // Funções para touch/swipe
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        isDragging = true;
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault(); // Previne scroll da página
    }

    function handleTouchEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        
        touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;
        const minSwipeDistance = 50; // Distância mínima para considerar swipe

        if (Math.abs(diffX) > minSwipeDistance) {
            if (diffX > 0) {
                // Swipe para esquerda - próximo
                if (currentIndex < totalEvents - eventsPerView) {
                    currentIndex++;
                } else {
                    // Loop para o início
                    currentIndex = 0;
                }
            } else {
                // Swipe para direita - anterior
                if (currentIndex > 0) {
                    currentIndex--;
                } else {
                    // Loop para o final
                    currentIndex = Math.max(0, totalEvents - eventsPerView);
                }
            }
            updateSliderPosition();
            updateButtonsVisibility();
        }
    }

    // Event listeners para os botões
    sliderLeft.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSliderPosition();
            updateButtonsVisibility();
        }
    });

    sliderRight.addEventListener('click', () => {
        if (currentIndex < totalEvents - eventsPerView) {
            currentIndex++;
            updateSliderPosition();
            updateButtonsVisibility();
        } else if (currentIndex === totalEvents - eventsPerView) {
            // Loop para o início
            currentIndex = 0;
            updateSliderPosition();
            updateButtonsVisibility();
        }
    });

    // Event listeners para touch/swipe (apenas em dispositivos móveis)
    if ('ontouchstart' in window) {
        sliderContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        sliderContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        sliderContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Loader mantido para boa UX
    gridMural.innerHTML = `
        <div class="loader-container" style="grid-column: 1/-1; text-align: center; padding: 30px;">
            <i class="fas fa-paw fa-spin" style="font-size: 1.5rem; color: #d4a017;"></i>
        </div>
    `;
    const hoje = new Date().toISOString().split('T')[0];
    const q = query(
        collection(db, "banners"), 
        where("dataISO", ">=", hoje),
        orderBy("dataISO", "asc"), 
        limit(5));

    onSnapshot(q, (snapshot) => {
        gridMural.innerHTML = ""; 
        
        if (snapshot.empty) {
            gridMural.style.display = 'none'; 
            sliderLeft.style.display = 'none';
            sliderRight.style.display = 'none';
            sliderContainer.classList.remove('show-shadow-left', 'show-shadow-right');
            return;
        }

        gridMural.style.display = 'flex'; // Muda para flex para o slider
        totalEvents = snapshot.size;
        currentIndex = 0; // Reset index

        snapshot.forEach((doc) => {
            const dados = doc.data();
            
            // Geramos o HTML usando a fábrica do utils.js
            // Passamos o ID e os Dados para a função
            const cardHTML = criarCardMuralHTML(doc.id, dados);
            
            gridMural.insertAdjacentHTML('beforeend', cardHTML);
        });

        updateButtonsVisibility();
        setTimeout(reveal, 200);
    });
}

function carregarPetsPorEspecie(especieBusca, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    // Colocando o loader específico para cada grid (Cachorros/Gatos)
    grid.innerHTML = `
        <div class="loader-container" style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <i class="fas fa-paw fa-spin" style="font-size: 2rem; color: #d4a017;"></i>
            <p style="margin-top: 10px; color: #999; font-size: 0.9rem;">Buscando ${especieBusca.toLowerCase()}s...</p>
        </div>
    `;

    const q = query(
        collection(db, "pets"),
        where("status", "==", "disponivel"),
        where("especie", "==", especieBusca), 
        orderBy("criadoEm", "desc"),
        limit(3)
    );

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = "";
        if (snapshot.empty) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #999;">Nenhum ${especieBusca.toLowerCase()} para adoção no momento.</p>`;
            return;
        }
        snapshot.forEach((doc) => {
            const pet = doc.data();
            const cardHTML = criarCardPetHTML(pet, doc.id);
            grid.insertAdjacentHTML('beforeend', cardHTML);
        });
        setTimeout(reveal, 200);
    });
}

// 3. INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    carregarMural();
    carregarPetsPorEspecie('Cachorro', 'grid-cachorros');
    carregarPetsPorEspecie('Gato', 'grid-gatos');

    configurarModal('grid-cachorros');
    configurarModal('grid-gatos');
    configurarLightbox();
});

// Função para animar e funcionar os contadores de estatísticas
async function carregarEstatisticas() {
    const docRef = doc(db, "estatisticas", "geral");

    // onSnapshot faz a Home "ouvir" o banco em tempo real
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const dados = docSnap.data();
            document.querySelectorAll('.counter').forEach(el => {
                const target = el.getAttribute('data-target');
                const valorFinal = dados[target] || 0;
                
                // Animação
                let start = 0;
                const duration = 2000;
                const step = (valorFinal / (duration / 16));
                
                const animate = () => {
                    start += step;
                    if (start < valorFinal) {
                        el.innerText = Math.ceil(start);
                        requestAnimationFrame(animate);
                    } else {
                        el.innerText = valorFinal;
                    }
                };
                animate();
            });
        }
    });
}
carregarEstatisticas();

//==================================
//      LÓGICA INSTITUCIONAL & AUXILIAR
//==================================

window.contatoWhatsApp = (nomePet) => {
    const mensagem = `Olá! Vi o(a) ${nomePet} no site e gostaria de saber mais sobre a adoção.`;
    window.open(`https://wa.me/47989134439?text=${encodeURIComponent(mensagem)}`, '_blank');
};

window.addEventListener("scroll", reveal);
window.addEventListener("load", reveal);

window.startCounter = function(el) {
    if (el.dataset.started === "true") return;
    el.dataset.started = "true";
    const target = +el.getAttribute('data-target');
    const speed = 200;
    const inc = target / speed;

    const updateCount = () => {
        const current = +el.innerText.replace('+', '');
        if (current < target) {
            el.innerText = Math.ceil(current + inc);
            setTimeout(updateCount, 10);
        } else {
            el.innerText = target + "+";
        }
    };
    updateCount();
}

// Funções do Modal e PIX
window.abrirModal = () => document.getElementById('modalItens')?.style.setProperty('display', 'flex');
window.fecharModal = () => document.getElementById('modalItens')?.style.setProperty('display', 'none');

window.addEventListener("click", (event) => {
    const modal = document.getElementById('modalItens');
    if (event.target === modal) fecharModal();
});

window.copiarPix = function(botao) {
    const chave = document.getElementById('pix-chave')?.innerText || "24.176.362/0001-04";
    navigator.clipboard.writeText(chave).then(() => {
        const textoOriginal = botao.innerText;
        botao.innerText = "Copiado! ✅";
        setTimeout(() => { botao.innerText = textoOriginal; }, 2000);
    });
};

window.abrirModalEvento = async (id) => {
    const modal = document.getElementById('modal-evento');
    const containerInner = modal.querySelector('.modal-content');

    try {
        const docRef = doc(db, "banners", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const dados = docSnap.data();
            
            // Injetamos o botão E o conteúdo do utils.js
            containerInner.innerHTML = `
                <button class="btn-fechar-modal" onclick="fecharModalEvento()">×</button>
                ${criarConteudoEventoHTML(dados, id)}
            `;

            // Forçamos o display flex para centralizar
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; 
        }
    } catch (error) {
        console.error("Erro ao carregar evento:", error);
    }
};

window.fecharModalEvento = () => {
    document.body.style.overflow = 'auto';
    document.getElementById('modal-evento').style.display = 'none';
};

