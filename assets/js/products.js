window.ProductsModule = {
    getProducts() {
        return window.StorageManager.get('assistia_products', []);
    },
    saveProduct(product) {
        const products = this.getProducts();
        if (!product.id) {
            product.id = 'prod_' + Date.now();
        }
        product.stock = Math.max(0, parseInt(product.stock) || 0); // Impede estoque negativo
        product.price = parseFloat(product.price) || 0;

        const index = products.findIndex(p => p.id === product.id);
        if (index >= 0) {
            products[index] = product;
        } else {
            products.push(product);
        }
        window.StorageManager.set('assistia_products', products);
        return product;
    },
    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== id);
        window.StorageManager.set('assistia_products', products);
    },
    getProductById(id) {
        return this.getProducts().find(p => p.id === id);
    },
    decrementStock(productId, qty = 1) {
        const products = this.getProducts();
        const prod = products.find(p => p.id === productId);
        if (prod) {
            if (prod.stock >= qty) {
                prod.stock -= qty;
                window.StorageManager.set('assistia_products', products);
                return true;
            }
            return false; // Sem estoque suficiente
        }
        return false;
    },
    renderProductsUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const products = this.getProducts();
        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-box-open"></i>
                    <p>Nenhum produto cadastrado no momento.</p>
                </div>`;
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="card product-card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="mb-1">${p.name}</h4>
                        <span class="badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}">
                            Estoque: ${p.stock} un
                        </span>
                    </div>
                    <div class="text-end">
                        <strong class="fs-5 text-primary">R$ ${p.price.toFixed(2)}</strong>
                        <div class="mt-2">
                            <button class="btn btn-outline-secondary btn-sm" onclick="window.ProductsModule.openEditModal('${p.id}')">
                                <i class="fa-solid fa-pen"></i> Editar
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="window.ProductsModule.handleDelete('${p.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <p class="text-sm mt-2 mb-1 text-muted">${p.description}</p>
                <small class="text-muted d-block"><strong>Checkout:</strong> ${p.checkoutUrl}</small>
            </div>
        `).join('');
    },
    openEditModal(id) {
        const p = this.getProductById(id);
        if (!p) return;
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-checkout').value = p.checkoutUrl;
        document.getElementById('prod-desc').value = p.description;

        document.getElementById('modal-product-title').innerText = 'Editar Produto';
        document.getElementById('modal-product').classList.add('active');
    },
    handleDelete(id) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            this.deleteProduct(id);
            this.renderProductsUI('products-list');
            if (window.Toast) window.Toast.show('Produto removido com sucesso!');
        }
    }
};
