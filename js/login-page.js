import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('contextmenu', event => event.preventDefault()); // Bloqueia clique direito

document.addEventListener('keydown', (event) => {
    if (
        event.key === 'F12' || 
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J' || event.key === 'C')) || 
        (event.ctrlKey && event.key === 'u')
    ) {
        event.preventDefault();
    }
});

const loginForm = document.getElementById('form-login');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const errorDiv = document.getElementById('login-error');

// Variáveis de controle de tentativas
let loginAttempts = 0;
const MAX_ATTEMPTS = 3;
const BLOCK_TIME = 3 * 60 * 60 * 1000; // 3 horas em milissegundos

// Função para verificar bloqueio temporário
const checkLockout = () => {
    const lockoutTime = localStorage.getItem('login_lockout');
    if (lockoutTime) {
        const remaining = parseInt(lockoutTime) - Date.now();
        if (remaining > 0) {
            const hours = Math.ceil(remaining / (1000 * 60 * 60));
            return `Acesso bloqueado por segurança. Tente novamente em ${hours}h.`;
        } else {
            localStorage.removeItem('login_lockout');
            loginAttempts = 0;
        }
    }
    return null;
};

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Verificação de Bloqueio Prévio
    const lockoutMsg = checkLockout();
    if (lockoutMsg) {
        errorDiv.style.display = "block";
        errorDiv.innerText = lockoutMsg;
        return;
    }

    // 2. Sanitização Básica (Impedir scripts/caracteres estranhos)
    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value;

    // Regex simples para validar formato de email e evitar injeção
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
        errorDiv.style.display = "block";
        errorDiv.innerText = "Formato de e-mail inválido.";
        return;
    }

    try {
        btnLogin.innerText = "PROCESSANDO...";
        btnLogin.disabled = true;
        errorDiv.style.display = "none";

        await signInWithEmailAndPassword(auth, emailValue, passwordValue);
        
        // Sucesso
        loginAttempts = 0;
        localStorage.removeItem('login_lockout');
        window.location.replace("admin.html"); // .replace esconde a página de login do histórico

    } catch (error) {
        loginAttempts++;
        btnLogin.disabled = false;
        btnLogin.innerText = "Sign In";
        errorDiv.style.display = "block";

        // Bloqueio após 3 tentativas
        if (loginAttempts >= MAX_ATTEMPTS) {
            const expiry = Date.now() + BLOCK_TIME;
            localStorage.setItem('login_lockout', expiry.toString());
            errorDiv.innerText = "Muitas tentativas falhas. Acesso bloqueado.";
            return;
        }

        // Tratamento Genérico (Segurança: não dizer se foi a senha ou o email que errou)
        if (error.code.includes('auth/')) {
            errorDiv.innerText = "Credenciais inválidas ou acesso não autorizado.";
        } else {
            errorDiv.innerText = "Sistema temporariamente indisponível.";
        }

        // Limpa o console para não expor detalhes do Firebase
        console.clear();
    }
});