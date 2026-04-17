# 🐾 Patudos da Rua

> **Projeto Acadêmico de Desenvolvimento Web** > Uma plataforma moderna para gestão e visualização de animais para adoção, desenvolvida para apoiar ONGs e instituições de proteção animal.

---

## 📖 Sobre o Projeto
Este site foi criado como parte de um desafio acadêmico para entregar uma solução real e de baixo custo para a comunidade. O foco é facilitar o encontro entre animais que precisam de um lar e possíveis adotantes, oferecendo um painel administrativo para a ONG gerenciar o catálogo de forma dinâmica.

## 🚀 Funcionalidades
* **Catálogo Responsivo:** Visualização de pets com modais de detalhes adaptáveis.
* **Painel Administrativo:** Área protegida por autenticação para cadastro e exclusão de pets.
* **Mural Dinâmico:** Gestão de banners e avisos da instituição.
* **Upload de Imagens:** Integração com Cloudinary para armazenamento de fotos.
* **Banco de Dados em Tempo Real:** Atualizações instantâneas via Firebase Firestore.

## 🛠️ Tecnologias Utilizadas
* **Frontend:** HTML5, CSS3 (Mobile First) e JavaScript (Vanilla).
* **Backend como Serviço (BaaS):** Firebase (Auth & Firestore).
* **Armazenamento de Mídia:** Cloudinary API.
* **Hospedagem:** Firebase Hosting.

## 📦 Como Rodar o Projeto
1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/ONG-patudos-da-rua.git
    ```
2.  **Configuração do Firebase:**
    * Crie um arquivo `js/firebase-config.js`.
    * Adicione suas chaves do Firebase Console (conforme o modelo em `js/firebase-config.example.js`).
3.  **Execução:**
    * Basta abrir o arquivo `index.html` em seu navegador ou usar a extensão *Live Server* no VS Code.

## 🛡️ Segurança (Regras do Firestore)
O projeto utiliza **Firebase Security Rules** para garantir que apenas usuários autenticados possam realizar alterações no banco de dados, enquanto a leitura é pública para todos os visitantes.

## 👥 Equipe
* **Ítalo David** – Desenvolvedor Web Front-end


