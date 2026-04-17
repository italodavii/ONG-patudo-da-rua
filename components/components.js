const headerHTML = `
    <header>
        <div class="container navbar">
            <div class="logo">
                <a href="index.html" class="logo-link">
                    <img src="assets/branding/logo-sf.png" alt="Logo">
                    <div class="logo-text"><span class="blue">PATUDOS</span> <span class="orange">DA RUA</span></div>
                </a>
            </div>
            
            <button class="menu-toggle" id="menu-toggle">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <nav>
                <ul class="nav-links" id="nav-menu">
                    <li><a href="index.html#eventos">Eventos</a></li>
                    <li><a href="catalogo.html">Conheça os Patudos</a></li>
                    <li class="dropdown">
                        <a href="javascript:void(0)" class="dropbtn">Conheça <i class="fas fa-chevron-down arrow-icon"></i></a>
                        <div class="dropdown-content">
                            <a href="sobre.html">Nossa História</a>
                            <a href="como-ajudar.html">Como Ajudar</a>
                        </div>
                    </li>
                    <li><a href="https://wa.me/47989134439" class="btn-contact">Contato <img src="assets/icon/fone.png" alt=""></a></li>
                </ul>
            </nav>
        </div>
    </header>
`;

const footerHTML = `
    <footer class="main-footer">
        <div class="footer-container">
            <div class="footer-col branding">
                <img src="assets/branding/logo.jpg" alt="Patudos da Rua" class="footer-logo">
                <p>Transformando a vida de animais de rua em Joinville através do amor e da adoção responsável.</p>
            </div>

            <div class="footer-col">
                <h4>Institucional</h4>
                <ul>
                    <li><a href="sobre.html">Sobre Nós</a></li>
                    <li><a href="como-ajudar.html">Como Ajudar</a></li>
                    <li><a href="login.html">Painel Admin</a></li> <!-- LEMBRAR DE RETIRAR E ALOCAR EM LUGAR APROPRIADO -->
                </ul>
            </div>

            <div class="footer-col">
                <h4>Envolva-se</h4>
                <ul>
                    <li><a href="catalogo.html">Quero Adotar</a></li>
                    <li><a href="como-ajudar.html#voluntario">Ser Voluntário</a></li>
                    <li><a href="como-ajudar.html#voluntario">Faça uma Doação</a></li>
                    <li><a href="denuncias.html">Denúncias</a></li>
                </ul>
            </div>

            <div class="footer-col social-focus">
                <h4>Conecte-se com a ONG</h4>
                <p>Acompanhe nossos resgates e finais felizes diariamente:</p>
                
                <div class="social-links-container">
                    <a href="https://www.instagram.com/patudosdarua/" target="_blank" class="social-btn instagram">
                        <i class="fab fa-instagram"></i>
                        <span>@patudosdarua</span>
                    </a>
                    <a href="https://www.facebook.com/profile.php?id=100080446760196" target="_blank" class="social-btn facebook">
                        <i class="fab fa-facebook-f"></i>
                        <span>/patudosdarua</span>
                    </a>
                </div>

                <p class="footer-contact-info">
                    <i class="fas fa-envelope"></i> contato@patudosdarua.com.br<br>
                    <i class="fas fa-map-marker-alt"></i> Joinville, SC
                </p>
            </div>
        </div>

        <div class="footer-bottom">
            <hr>
            <div class="footer-copy">
                <p>&copy; 2026 Patudos da Rua. Todos os direitos reservados. Desenvolvido por <strong>ItaloDEV.</strong></p>
                <div class="footer-links">
                    <a href="legal.html">Privacidade</a>
                    <a href="legal.html">Termos de Uso</a>
                </div>
            </div>
        </div>
    </footer>
`;

// Função que injeta os componentes nas páginas
document.addEventListener("DOMContentLoaded", () => {
    const headerElement = document.getElementById("header-placeholder");
    const footerElement = document.getElementById("footer-placeholder");

    if (headerElement) {
        headerElement.innerHTML = headerHTML;
        
        const toggle = document.getElementById('menu-toggle');
        const menu = document.getElementById('nav-menu');

        const toggleMenu = () => {
            const isActive = menu.classList.toggle('active');
            toggle.classList.toggle('active');
            
            document.body.style.overflow = isActive ? 'hidden' : '';
        };

        const closeMenu = () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = ''; 
        };

        toggle?.addEventListener('click', toggleMenu);

        const navLinks = menu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
    
    if (footerElement) {
        footerElement.innerHTML = footerHTML;
    }
});