window.AIEngine = {
    getBrainConfig() {
        return window.StorageManager.get('assistia_brain', {
            storeName: 'Nossa Loja',
            aiName: 'AssistIA',
            tone: 'Simpático',
            rules: ''
        });
    },

    parseProductOffer(rawText) {
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let name = lines[0] || 'Novo Produto';
        let price = 0.00;
        let checkoutUrl = '';

        const priceMatch = rawText.match(/R\$\s?(\d+[\.,]?\d*)/i) || rawText.match(/(\d+[\.,]\d{2})/);
        if (priceMatch) price = parseFloat(priceMatch[1].replace(',', '.'));

        const urlMatch = rawText.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch) checkoutUrl = urlMatch[0];

        return {
            name,
            price: price || 97.00,
            stock: 10,
            checkoutUrl: checkoutUrl || 'https://meucheckout.com',
            description: lines.slice(1).join(' ') || 'Produto de alta qualidade.',
            sizes: ['P', 'M', 'G']
        };
    },

    generateSalesResponse(userMessage, currentProductId) {
        const text = userMessage.toLowerCase().trim();
        const brain = this.getBrainConfig();
        const products = window.ProductsModule.getProducts();
        
        let targetProduct = products.find(p => p.id === currentProductId) || products[0];

        // Se o cliente mencionar outro produto na mensagem
        for (let p of products) {
            if (text.includes(p.name.toLowerCase())) {
                targetProduct = p;
                break;
            }
        }

        if (!targetProduct) {
            return {
                text: `Olá! Sou a ${brain.aiName} da ${brain.storeName}. Em que posso te ajudar hoje?`,
                intent: 'Geral',
                sendCheckout: false
            };
        }

        // 1. Consulta de Tamanho e Estoque
        if (text.includes('tamanho') || text.includes(' m ') || text.includes(' p ') || text.includes(' g ') || text.includes('tem')) {
            if (targetProduct.stock > 0) {
                return {
                    text: `Temos sim! O produto **${targetProduct.name}** está disponível em estoque por apenas R$ ${targetProduct.price.toFixed(2)}. Gostaria de garantir a sua unidade agora?`,
                    intent: 'Consulta Estoque - Disponível',
                    sendCheckout: false,
                    productId: targetProduct.id
                };
            } else {
                const altProduct = products.find(p => p.id !== targetProduct.id && p.stock > 0);
                let altText = altProduct ? ` Posso te recomendar o **${altProduct.name}** que temos disponível!` : '';
                return {
                    text: `Poxa, o tamanho/unidade do **${targetProduct.name}** acabou de esgotar no nosso estoque!${altText}`,
                    intent: 'Consulta Estoque - Esgotado',
                    sendCheckout: false
                };
            }
        }

        // 2. Pergunta de Preço
        if (text.includes('quanto') || text.includes('preço') || text.includes('valor') || text.includes('custa')) {
            return {
                text: `O **${targetProduct.name}** está por R$ ${targetProduct.price.toFixed(2)}. Temos apenas ${targetProduct.stock} unidades em estoque! Quer que eu te envie o link para garantir?`,
                intent: 'Consulta de Preço',
                sendCheckout: false,
                productId: targetProduct.id
            };
        }

        // 3. Objeção de Preço
        if (text.includes('caro') || text.includes('desconto')) {
            return {
                text: `Entendo perfeitamente! Mas este produto conta com garantia de qualidade e envio imediato. Conseguimos parcelar sem juros. Vamos fechar?`,
                intent: 'Objeção - Preço',
                sendCheckout: false
            };
        }

        // 4. Intenção de Compra / Fechamento
        if (text.includes('quero') || text.includes('comprar') || text.includes('link') || text.includes('sim') || text.includes('fechar')) {
            if (targetProduct.stock > 0) {
                return {
                    text: `Excelente decisão! Clique no link seguro abaixo para finalizar seu pedido do **${targetProduct.name}** por R$ ${targetProduct.price.toFixed(2)}:\n\n${targetProduct.checkoutUrl}`,
                    intent: 'Intenção de Compra',
                    sendCheckout: true,
                    productId: targetProduct.id
                };
            } else {
                return {
                    text: `Infelizmente esse item esgotou no momento. Deseja ser avisado assim que renovarmos o estoque?`,
                    intent: 'Sem Estoque',
                    sendCheckout: false
                };
            }
        }

        // Fallback Consultivo
        return {
            text: `Perfeito! O **${targetProduct.name}** é uma das nossas melhores opções. Posso te ajudar a realizar o pedido?`,
            intent: 'Atendimento Geral',
            sendCheckout: false,
            productId: targetProduct.id
        };
    }
};
