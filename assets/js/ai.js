window.AIEngine = {
    parseProductOffer(rawText) {
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        let name = lines[0] || 'Novo Produto';
        let price = 0.00;
        let checkoutUrl = '';
        let description = '';

        const priceMatch = rawText.match(/R\$\s?(\d+[\.,]?\d*)/i) || rawText.match(/(\d+[\.,]\d{2})/);
        if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(',', '.'));
        }

        const urlMatch = rawText.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch) {
            checkoutUrl = urlMatch[0];
        }

        const descLines = lines.filter(l => !l.includes('http') && !l.toLowerCase().includes('r$'));
        if (descLines.length > 1) {
            description = descLines.slice(1).join(' ');
        } else if (descLines.length === 1) {
            description = descLines[0];
        }

        return {
            name,
            price: price || 97.00,
            checkoutUrl: checkoutUrl || 'https://checkout.exemplo.com',
            description: description || 'Oferta especial.',
            targetAudience: 'Público Alvo Geral',
            faqs: 'Acesso imediato e garantia inclusa.'
        };
    },

    generateSalesResponse(input, product) {
        const text = input.toLowerCase().trim();
        const pName = product ? product.name : 'o treinamento';
        const pPrice = product ? `R$ ${parseFloat(product.price).toFixed(2)}` : 'R$ 97,00';
        const pCheckout = product ? product.checkoutUrl : '#';

        if (text.includes('quanto') || text.includes('preço') || text.includes('preco') || text.includes('valor') || text.includes('custa')) {
            return {
                text: `O investimento no ${pName} é de apenas ${pPrice}. Quer que eu te explique rapidinho o que está incluso?`,
                sendCheckout: false,
                intent: 'Consulta de Preço'
            };
        }

        if (text.includes('como funciona') || text.includes('saber mais') || text.includes('explic')) {
            return {
                text: `${pName} foi feito para você dominar estratégias de vendas e automação de forma prática. Posso te enviar o link com os detalhes?`,
                sendCheckout: false,
                intent: 'Explicação do Produto'
            };
        }

        if (text.includes('caro') || text.includes('desconto') || text.includes('promoção') || text.includes('promocao')) {
            return {
                text: `Entendo perfeitamente. Mas pelo retorno que você terá automatizando suas vendas, o investimento de ${pPrice} se paga muito rápido! Vamos fechar?`,
                sendCheckout: false,
                intent: 'Objeção - Preço'
            };
        }

        if (text.includes('pensar') || text.includes('será') || text.includes('sera') || text.includes('dúvida') || text.includes('duvida')) {
            return {
                text: `Sem problemas! Lembrando que você tem 7 dias de garantia para testar sem risco. Quer aproveitar a vaga com o valor atual?`,
                sendCheckout: false,
                intent: 'Objeção - Hesitação'
            };
        }

        if (text.includes('online') || text.includes('receber') || text.includes('acesso') || text.includes('onde')) {
            return {
                text: `Sim! O acesso é 100% online e liberado imediatamente no seu e-mail logo após a confirmação.`,
                sendCheckout: false,
                intent: 'Dúvida - Entrega'
            };
        }

        if (text.includes('comprar') || text.includes('quero') || text.includes('link') || text.includes('fechar') || text.includes('interessante') || text.includes('sim')) {
            return {
                text: `Excelente escolha! Segue o link seguro para garantir sua vaga no ${pName} por ${pPrice}: ${pCheckout}`,
                sendCheckout: true,
                intent: 'Intenção de Compra'
            };
        }

        return {
            text: `Perfeito! Fico à disposição para tirar qualquer dúvida sobre o ${pName}. Deseja garantir seu acesso agora?`,
            sendCheckout: false,
            intent: 'Atendimento Geral'
        };
    }
};
