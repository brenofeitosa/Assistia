/**
 * Persistence Layer - Storage Manager
 * Encapsula o LocalStorage, preparado para futura troca por chamadas de API (REST/GraphQL).
 */
const StorageManager = {
    KEYS: {
        PRODUCTS: 'assistia_products',
        LEADS: 'assistia_leads',
        SALES: 'assistia_sales',
        SETTINGS: 'assistia_settings'
    },

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Erro ao ler ${key} do LocalStorage:`, e);
            return [];
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Erro ao salvar ${key} no LocalStorage:`, e);
        }
    },

    clearAll() {
        localStorage.clear();
    }
