window.StorageManager = {
    get(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Erro ao ler ${key}:`, e);
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Erro ao salvar ${key}:`, e);
        }
    },
    clearAll() {
        localStorage.clear();
    },
    seedInitialData() {
        if (!localStorage.getItem('assistia_initialized')) {
            const initialProducts = [
                {
                    id: 'prod_1',
                    name: 'Camiseta Preta Minimalist',
                    price: 89.90,
                    description: 'Camiseta 100% algodão penteado, modelagem street.',
                    stock: 12,
                    sizes: ['P', 'M', 'G', 'GG'],
                    checkoutUrl: 'https://meucheckout.com/camiseta-preta'
                },
                {
                    id: 'prod_2',
                    name: 'Curso de Vendas pelo WhatsApp',
                    price: 97.00,
                    description: 'Aprenda a automatizar e vender todos os dias.',
                    stock: 999,
                    sizes: ['Digital'],
                    checkoutUrl: 'https://meucheckout.com/curso-vendas'
                }
            ];

            const initialCustomers = [
                {
                    id: 'cust_1',
                    name: 'João Silva',
                    phone: '+55 11 98765-4321',
                    lastInteraction: new Date().toISOString(),
                    chatsCount: 3,
                    purchasesCount: 1,
                    totalSpent: 97.00,
                    status: 'Ativo'
                },
                {
                    id: 'cust_2',
                    name: 'Maria Oliveira',
                    phone: '+55 21 99887-6655',
                    lastInteraction: new Date(Date.now() - 3600000 * 2).toISOString(),
                    chatsCount: 1,
                    purchasesCount: 0,
                    totalSpent: 0.00,
                    status: 'Aguardando'
                }
            ];

            const initialChats = [
                {
                    id: 'chat_1',
                    customerId: 'cust_1',
                    customerName: 'João Silva',
                    lastMessage: 'Achei ótimo! Vou querer sim.',
                    timestamp: new Date().toISOString(),
                    unread: false,
                    status: 'Em andamento',
                    mode: 'AI', // 'AI' ou 'HUMAN'
                    messages: [
                        { sender: 'user', text: 'Tem camiseta preta?' },
                        { sender: 'ai', text: 'Temos sim! A Camiseta Preta Minimalist está R$ 89,90. Qual tamanho você prefere?' },
                        { sender: 'user', text: 'Tenho interesse no M.' },
                        { sender: 'ai', text: 'Temos o tamanho M disponível em estoque! Deseja que eu te envie o link de pagamento?' },
                        { sender: 'user', text: 'Achei ótimo! Vou querer sim.' }
                    ]
                },
                {
                    id: 'chat_2',
                    customerId: 'cust_2',
                    customerName: 'Maria Oliveira',
                    lastMessage: 'Vou dar uma olhada e te aviso.',
                    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
                    unread: true,
                    status: 'Aguardando Resposta',
                    mode: 'AI',
                    messages: [
                        { sender: 'user', text: 'Quero saber sobre o Curso de Vendas.' },
                        { sender: 'ai', text: 'O investimento é R$ 97,00 com acesso imediato! Quer tirar alguma dúvida?' },
                        { sender: 'user', text: 'Vou dar uma olhada e te aviso.' }
                    ]
                }
            ];

            const initialAutomations = [
                { id: 'auto_1', name: 'Atendimento Automático de Novos Clientes', description: 'Inicia a conversa assim que um novo lead envia mensagem no WhatsApp.', active: true },
                { id: 'auto_2', name: 'Consulta e Reserva de Estoque em Tempo Real', description: 'Informa disponibilidade exata e impede vendas sem estoque.', active: true },
                { id: 'auto_3', name: 'Recuperação Automática de Carrinho Abandono', description: 'Envia mensagem após 2 horas sem resposta do cliente.', active: true },
                { id: 'auto_4', name: 'Alerta de Estoque Baixo', description: 'Notifica o gestor quando um produto tiver menos de 3 unidades.', active: false }
            ];

            const initialBrain = {
                storeName: 'Minha Loja Virtual',
                aiName: 'AssistIA Vendedora',
                tone: 'Consultivo, simpático e objetivo',
                goal: 'Esclarecer dúvidas sobre produtos e fechar vendas no WhatsApp.',
                businessInfo: 'Loja online de vestuário e produtos digitais com envio imediato para todo o Brasil.',
                rules: 'Sempre conferir estoque antes de confirmar o tamanho. Nunca oferecer descontos acima de 10%.',
                hours: 'Segunda a Segunda, das 08:00 às 22:00',
                welcomeMsg: 'Olá! Sou a assistente virtual da loja. Como posso te ajudar hoje?',
                customInstructions: 'Se o cliente disser que está caro, destaque a qualidade do material e a garantia.'
            };

            this.set('assistia_products', initialProducts);
            this.set('assistia_customers', initialCustomers);
            this.set('assistia_chats', initialChats);
            this.set('assistia_automations', initialAutomations);
            this.set('assistia_brain', initialBrain);
            this.set('assistia_sales', []);
            this.set('assistia_initialized', true);
        }
    }
};
