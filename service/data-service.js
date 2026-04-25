import { db } from '../js/firebase-config.js';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, endBefore, limitToLast, onSnapshot, serverTimestamp, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * DataService - Camada de abstração para operações de banco de dados
 * Centraliza todas as operações com Firestore, retornando objetos JavaScript puros
 * Facilita migração futura para outros bancos (Supabase, API própria, etc.)
 */
export class DataService {

    /**
     * Busca todos os documentos de uma coleção
     * @param {string} colecao - Nome da coleção
     * @param {Object} opcoes - Opções de busca (filtros, ordenacao, limite)
     * @returns {Promise<Array>} Array de objetos com id e dados
     */
    static async buscarTodos(colecao, opcoes = {}) {
        try {
            let constraints = [collection(db, colecao)];

            // Aplicar filtros se fornecidos
            if (opcoes.filtros && Array.isArray(opcoes.filtros)) {
                opcoes.filtros.forEach(filtro => {
                    constraints.push(where(filtro.campo, filtro.operador, filtro.valor));
                });
            }

            // Aplicar ordenação se fornecida
            if (opcoes.ordenacao && Array.isArray(opcoes.ordenacao)) {
                opcoes.ordenacao.forEach(ordem => {
                    constraints.push(orderBy(ordem.campo, ordem.direcao || 'asc'));
                });
            }

            // Aplicar limite se fornecido
            if (opcoes.limite) {
                constraints.push(limit(opcoes.limite));
            }

            const q = query(...constraints);
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Erro ao buscar todos em ${colecao}:`, error);
            throw error;
        }
    }

    /**
     * Busca um documento por ID
     * @param {string} colecao - Nome da coleção
     * @param {string} id - ID do documento
     * @returns {Promise<Object|null>} Objeto com id e dados, ou null se não encontrado
     */
    static async buscarPorId(colecao, id) {
        try {
            const docRef = doc(db, colecao, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            }
            return null;
        } catch (error) {
            console.error(`Erro ao buscar por ID em ${colecao}:`, error);
            throw error;
        }
    }

    /**
     * Cria um novo documento
     * @param {string} colecao - Nome da coleção
     * @param {Object} dados - Dados do documento
     * @returns {Promise<string>} ID do documento criado
     */
    static async criar(colecao, dados) {
        try {
            // Adicionar timestamp de criação se não fornecido
            const dadosComTimestamp = {
                ...dados,
                criadoEm: dados.criadoEm || serverTimestamp()
            };

            const docRef = await addDoc(collection(db, colecao), dadosComTimestamp);
            return docRef.id;
        } catch (error) {
            console.error(`Erro ao criar documento em ${colecao}:`, error);
            throw error;
        }
    }

    /**
     * Atualiza um documento existente
     * @param {string} colecao - Nome da coleção
     * @param {string} id - ID do documento
     * @param {Object} dados - Dados para atualizar
     * @returns {Promise<void>}
     */
    static async atualizar(colecao, id, dados) {
        try {
            // Adicionar timestamp de atualização se não fornecido
            const dadosComTimestamp = {
                ...dados,
                atualizadoEm: dados.atualizadoEm || serverTimestamp()
            };

            const docRef = doc(db, colecao, id);
            await updateDoc(docRef, dadosComTimestamp);
        } catch (error) {
            console.error(`Erro ao atualizar documento em ${colecao}:`, error);
            throw error;
        }
    }

    /**
     * Deleta um documento
     * @param {string} colecao - Nome da coleção
     * @param {string} id - ID do documento
     * @returns {Promise<void>}
     */
    static async deletar(colecao, id) {
        try {
            const docRef = doc(db, colecao, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Erro ao deletar documento em ${colecao}:`, error);
            throw error;
        }
    }

    /**
     * Busca documentos com um filtro simples
     * @param {string} colecao - Nome da coleção
     * @param {string} campo - Campo para filtrar
     * @param {string} operador - Operador de comparação (==, >, <, etc.)
     * @param {any} valor - Valor para comparar
     * @param {Object} opcoes - Opções adicionais (ordenacao, limite)
     * @returns {Promise<Array>} Array de objetos com id e dados
     */
    static async buscarComFiltro(colecao, campo, operador, valor, opcoes = {}) {
        try {
            let constraints = [
                collection(db, colecao),
                where(campo, operador, valor)
            ];

            // Aplicar ordenação se fornecida
            if (opcoes.ordenacao && Array.isArray(opcoes.ordenacao)) {
                opcoes.ordenacao.forEach(ordem => {
                    constraints.push(orderBy(ordem.campo, ordem.direcao || 'asc'));
                });
            }

            // Aplicar limite se fornecido
            if (opcoes.limite) {
                constraints.push(limit(opcoes.limite));
            }

            const q = query(...constraints);
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Erro ao buscar com filtro em ${colecao}:`, error);
            throw error;
        }
    }

    /**
     * Busca documentos com paginação usando cursor
     * @param {string} colecao - Nome da coleção
     * @param {Object} opcoes - Opções de busca (filtros, ordenacao, limite, cursor)
     * @returns {Promise<Object>} Objeto com documentos e metadados de paginação
     */
    static async buscarComPaginacao(colecao, opcoes = {}) {
        try {
            let constraints = [collection(db, colecao)];

            // Aplicar filtros se fornecidos
            if (opcoes.filtros && Array.isArray(opcoes.filtros)) {
                opcoes.filtros.forEach(filtro => {
                    constraints.push(where(filtro.campo, filtro.operador, filtro.valor));
                });
            }

            // Aplicar ordenação se fornecida
            if (opcoes.ordenacao && Array.isArray(opcoes.ordenacao)) {
                opcoes.ordenacao.forEach(ordem => {
                    constraints.push(orderBy(ordem.campo, ordem.direcao || 'asc'));
                });
            }

            // Aplicar paginação
            if (opcoes.cursor) {
                if (opcoes.direcao === 'proximo') {
                    constraints.push(startAfter(opcoes.cursor));
                } else if (opcoes.direcao === 'anterior') {
                    constraints.push(endBefore(opcoes.cursor));
                    constraints.push(limitToLast(opcoes.limite || 10));
                }
            }

            // Aplicar limite se fornecido (exceto quando já aplicamos limitToLast)
            if (opcoes.limite && opcoes.direcao !== 'anterior') {
                constraints.push(limit(opcoes.limite));
            }

            const q = query(...constraints);
            const snapshot = await getDocs(q);

            return {
                documentos: snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })),
                primeiroDoc: snapshot.docs[0] || null,
                ultimoDoc: snapshot.docs[snapshot.docs.length - 1] || null,
                vazio: snapshot.empty
            };
        } catch (error) {
            console.error(`Erro ao buscar com paginação em ${colecao}:`, error);
            throw error;
        }
    }

    /**
     * Escuta mudanças em tempo real em uma coleção
     * @param {string} colecao - Nome da coleção
     * @param {Function} callback - Função chamada quando há mudanças
     * @param {Object} opcoes - Opções de query (filtros, ordenacao, limite)
     * @returns {Function} Função para cancelar o listener
     */
    static escutarColecao(colecao, callback, opcoes = {}) {
        try {
            let constraints = [collection(db, colecao)];

            // Aplicar filtros se fornecidos
            if (opcoes.filtros && Array.isArray(opcoes.filtros)) {
                opcoes.filtros.forEach(filtro => {
                    constraints.push(where(filtro.campo, filtro.operador, filtro.valor));
                });
            }

            // Aplicar ordenação se fornecida
            if (opcoes.ordenacao && Array.isArray(opcoes.ordenacao)) {
                opcoes.ordenacao.forEach(ordem => {
                    constraints.push(orderBy(ordem.campo, ordem.direcao || 'asc'));
                });
            }

            // Aplicar limite se fornecido
            if (opcoes.limite) {
                constraints.push(limit(opcoes.limite));
            }

            const q = query(...constraints);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const documentos = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(documentos);
            }, (error) => {
                console.error(`Erro no listener de ${colecao}:`, error);
            });

            return unsubscribe;
        } catch (error) {
            console.error(`Erro ao configurar listener para ${colecao}:`, error);
            throw error;
        }
    }

    /**
     * Escuta mudanças em um documento específico
     * @param {string} colecao - Nome da coleção
     * @param {string} id - ID do documento
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para cancelar o listener
     */
    static escutarDocumento(colecao, id, callback) {
        try {
            const docRef = doc(db, colecao, id);

            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const documento = {
                        id: docSnap.id,
                        ...docSnap.data()
                    };
                    callback(documento);
                } else {
                    callback(null);
                }
            }, (error) => {
                console.error(`Erro no listener do documento ${colecao}/${id}:`, error);
            });

            return unsubscribe;
        } catch (error) {
            console.error(`Erro ao configurar listener para documento ${colecao}/${id}:`, error);
            throw error;
        }
    }

    /**
     * Conta documentos em uma coleção com filtros opcionais
     * @param {string} colecao - Nome da coleção
     * @param {Array} filtros - Array de objetos {campo, operador, valor}
     * @returns {Promise<number>} Número de documentos
     */
    static async contar(colecao, filtros = []) {
        try {
            // Filtrar filtros válidos (remover undefined/null)
            const filtrosValidos = filtros.filter(filtro =>
                filtro &&
                filtro.campo &&
                filtro.operador &&
                filtro.valor !== undefined &&
                filtro.valor !== null &&
                filtro.valor !== ""
            );

            if (filtrosValidos.length === 0) {
                // Sem filtros, contar todos os documentos
                const colRef = collection(db, colecao);
                const snapshot = await getCountFromServer(colRef);
                return snapshot.data().count;
            }

            // Com filtros, construir query
            let constraints = [collection(db, colecao)];

            filtrosValidos.forEach(filtro => {
                constraints.push(where(filtro.campo, filtro.operador, filtro.valor));
            });

            const q = query(...constraints);
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error(`Erro ao contar documentos em ${colecao}:`, error);
            console.error("Filtros que causaram erro:", filtros);

            // Em caso de erro (provavelmente índice faltando), tentar abordagem alternativa
            if (error.message && error.message.includes("index")) {
                console.warn("Índice composto necessário. Tentando contagem alternativa...");

                try {
                    // Buscar todos os documentos e filtrar no cliente (menos eficiente, mas funciona)
                    const todosDocumentos = await this.buscarTodos(colecao);
                    const documentosFiltrados = todosDocumentos.filter(doc => {
                        return filtros.every(filtro => {
                            if (!filtro || !filtro.campo || filtro.valor === undefined || filtro.valor === null || filtro.valor === "") {
                                return true; // filtro inválido, ignorar
                            }
                            return doc[filtro.campo] === filtro.valor;
                        });
                    });
                    return documentosFiltrados.length;
                } catch (fallbackError) {
                    console.error("Erro no fallback de contagem:", fallbackError);
                    return 0;
                }
            }

            throw error;
        }
    }
}