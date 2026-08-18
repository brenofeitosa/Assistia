window.CustomersModule = {
    getCustomers() {
        return window.StorageManager.get('assistia_customers', []);
    },
    saveCustomers(custs) {
        window.StorageManager.set('assistia_customers', custs);
    },
    renderCustomersUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const customers = this.getCustomers();

        if (customers.length === 0) {
            container.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Nenhum cliente cadastrado.</td></tr>`;
            return;
        }

        container.innerHTML = customers.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td>${c.chatsCount} conversas</td>
                <td><span class="badge badge-success">${c.purchasesCount} compras</span></td>
                <td><strong>R$ ${parseFloat(c.totalSpent).toFixed(2)}</strong></td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="window.CustomersModule.viewCustomerHistory('${c.id}')">
                        <i class="fa-solid fa-eye"></i> Histórico
                    </button>
                </td>
            </tr>
        `).join('');
    },
    viewCustomerHistory(custId) {
        const cust = this.getCustomers().find(c => c.id === custId);
        if (!cust) return;
        alert(`Cliente: ${cust.name}\nTelefone: ${cust.phone}\nTotal Gasto: R$ ${cust.totalSpent.toFixed(2)}\nÚltima Interação: ${new Date(cust.lastInteraction).toLocaleString('pt-BR')}`);
    }
};
