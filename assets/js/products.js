/**
 * Módulo de Produtos
 */
const ProductsModule = {
    getProducts() {
        return StorageManager.get(StorageManager.KEYS.PRODUCTS);
    },

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    },

    saveProduct(product) {
        const products = this.getProducts();
        if (!product.id) {
            product.id = 'prod_' + Date.now();
            products.push(product);
        } else {
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) products[index] = product;
        }
        StorageManager.set(StorageManager.KEYS.PRODUCTS, products);
        return product;
    },

    seedInitialData() {
        if (this.getProducts().length === 0) {
            this.saveProduct({
                id: 'prod_default',
                name: 'Curso de Vendas pelo WhatsApp',
                price: 97.00,
                description: 'Aprenda estratégias para vender mais pelo WhatsApp e automatizar seu atendimento.',
                checkoutUrl: 'https://meucheckout.com/curso',
                targetAudience: 'Empreendedores e Vendedores Digitais',
                faqs: 'Tem certificado? Sim. Qual a duração? Acesso vitalício.'
            });
        }
    },

    renderProductsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const products = this.getProducts();
        if (products.length === 0) {
            container.innerHTML = `<p class="text-sm">Nenhum produto cadastrado. Importe uma oferta acima!</p>`;
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="product-card">
                <div>
                    <h3>${p.name}</h3>
                    <div class="price">R$ ${parseFloat(p.price).toFixed(2)}</div>
                    <p>${p.description}</p>
                </div>
                <div>
                    <div class="text-sm"><strong>Checkout:</strong> ${p.checkoutUrl}</div>
                    <div class="text-sm mt-1"><strong>Público:</strong> ${p.targetAudience || 'Geral'}</div>
                </div>
            </div>
        `).join('');
    }
};
