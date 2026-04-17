import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- FUNÇÃO DE LOGIN ---
export async function realizarLogin(email, senha) {
    try {
        await signInWithEmailAndPassword(auth, email, senha);
        window.location.href = "admin.html"; 
    } catch (error) {
        console.error("Erro ao logar:", error.code);
        throw error; 
    }
}

// --- FUNÇÃO DE LOGOUT ---
export async function realizarLogout() {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        alert("Erro ao sair.");
    }
}

// --- PROTEÇÃO DE ROTA ---
export function verificarAutenticacao() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "login.html";
        }
    });
}