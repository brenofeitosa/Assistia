window.ProductsModule = {
    getProducts() {
        return window.StorageManager.get('assistia_products', []);
    },
    saveProduct(product) {
        const products = this.getProducts();
        if (!product.id) {
            product.id = 'prod_' + Date.now();
        }
        const index = products.findIndex(p => p.id === product.id);
        if (index >= 0) {
            products[index] = product;
        } else {
            products.push(product);
        }
        window.StorageManager.set('assistia_products', products);
        return product;
    },
    getProductById(id) {
        return this.getProducts().find(p => p.id === id);
    },
    seedInitialData() {
        if (this.getProducts().length === 0) {
            this.saveProduct({
                id: 'prod_1',
                name: 'Curso de Vendas pelo WhatsApp',
                price: 97.00,
                description: 'Aprenda estratégias para vender mais pelo WhatsApp e automatizar seu atendimento.',
                checkoutUrl: 'https://meucheckout.com/curso',
                targetAudience: 'Vendedores e Empreendedores',
                faqs: 'Tem garantia de 7 dias e acesso imediato.'
            });
        }
    },
    renderProductsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const products = this.getProducts();
        if (products.length === 0) {
            container.innerHTML = `<p class="text-sm">Nenhum produto cadastrado.</p>`;
            return;
        }
        container.innerHTML = products.map(p => `
            <div class="card p-3 mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <h3>${p.name}</h3>
                    <span class="badge badge-success">R$ ${parseFloat(p.price).toFixed(2)}</span>
                </div>
                <p class="text-sm mt-1">${p.description}</p>
                <small class="text-muted">Link: ${p.checkoutUrl}</small>
            </div>
        `).join('');
    }
};
