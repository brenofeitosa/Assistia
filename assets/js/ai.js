/**
 * Motor Local de IA - Vendedor Proativo e Parser de Ofertas
 * Desenhado para transicionar facilmente para OpenAI / Claude API no futuro.
 */
const AIEngine = {
    // 1. Parsing de Oferta a partir de texto bruto (Importar com IA)
    parseProductOffer(rawText) {
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        let extracted = {
            name: lines[0] || 'Novo Produto Digital',
            price: 97.00,
            description: '',
            checkoutUrl: '',
            targetAudience: 'Pessoas interessadas no tema',
            faqs: 'Acesso imediato após confirmação.'
        };

        // RegEx para extrair preço e links
        const priceRegex = /(?:R\$\s?|BRL\s?)?(\d+(?:[.,]\d{2})?)/i;
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        lines.forEach((line) => {
            if (line.match(urlRegex)) {
                extracted.checkoutUrl = line.match(urlRegex)[0];
            } else if (line.toLowerCase().includes('r$') || line.match(/\d+,\d{2}/)) {
                const match = line.match(priceRegex);
                if (match) {
                    extracted.price = parseFloat(match[1].replace(',', '.'));
                }
            } else if (line !== extracted.name && !extracted.description) {
                extracted.description += line + ' ';
            }
        });

        extracted.description = extracted.description.trim() || 'Descrição otimizada do produto.';
        if (!extracted.checkoutUrl) extracted.checkoutUrl = 'https://checkout.exemplo.com/produto';

        return extracted;
    },

    // 2. Motor de Conversação Vendedora Proativa (Simulador)
    generateSalesResponse(userMessage, productContext) {
        const msg = userMessage.toLowerCase();
        const pName = productContext ? productContext.name : 'nosso treinamento';
        const pPrice = productContext ? `R$ ${parseFloat(productContext.price).toFixed(2)}` : 'R$ 97,00';
        const pLink = productContext ? productContext.checkoutUrl : 'https://meucheckout.com';

        let response = { text: '', intent: 'question', sendCheckout: false };

        // Teste de Intenção: Dúvida de Preço
        if (msg.includes('quanto custa') || msg.includes('qual o valor') || msg.includes('preco') || msg.includes('preço')) {
            response.text = `O acesso ao ${pName} está por apenas ${pPrice}. Quer que eu te explique rapidinho como funciona e o que está incluído?`;
            response.intent = 'price_inquiry';
        } 
        // Teste de Intenção: Confirmação / Interesse
        else if (msg.includes('quero') || msg.includes('sim') || msg.includes('explicar') || msg.includes('como funciona')) {
            response.text = `${productContext.description} Você está começando agora nesse mercado ou já possui alguma experiência?`;
            response.intent = 'qualification';
        }
        // Teste de Intenção: Objeção / Dúvida Técnica
        else if (msg.includes('ja trabalho') || msg.includes('já trabalho') || msg.includes('iniciante') || msg.includes('funciona para mim')) {
            response.text = `Perfeito! Então os recursos avançados vão fazer total sentido para acelerar suas vendas no dia a dia. Pelo que você me contou, ele encaixa exatamente no que procura. Quer que eu te envie o link para começar?`;
            response.intent = 'objection_handled';
        }
        // Teste de Intenção: Decisão de Compra
        else if (msg.includes('quero comprar') || msg.includes('manda o link') || msg.includes('pode mandar') || msg.includes('link')) {
            response.text = `Excelente decisão! Aqui está o seu link seguro para garantir a sua vaga com desconto:\n\n👉 ${pLink}\n\nAssim que finalizar, você recebe o acesso imediato no seu e-mail!`;
            response.intent = 'buy_intent';
            response.sendCheckout = true;
        } 
        // Resposta Padrão Conduzindo para Venda
        else {
            response.text = `Entendi perfeitamente! No ${pName}, nosso foco é te dar resultados práticos. Ficou com alguma dúvida sobre o conteúdo ou quer aproveitar a condição especial de ${pPrice}?`;
            response.intent = 'general_nurture';
        }

        return response;
    }
};
