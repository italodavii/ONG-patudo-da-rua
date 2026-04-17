import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Credenciais de Exemplo - Substitua pelas suas no arquivo real
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SEU_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);

// CONFIGURAÇÕES CLOUDINARY
export const CLOUDINARY_CONFIG = {
    CLOUD_NAME: "SEU_CLOUD_NAME",
    UPLOAD_PRESET: "SEU_PRESET_AQUI"
};

// URL DA LOGO PADRÃO (Pode deixar a real ou uma genérica)
export const URL_LOGO_PADRAO = "URL_DA_SUA_LOGO_PADRAO";