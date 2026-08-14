// AssistIA - Conversational AI logic (behavior only)
// File: assets/assistia-ai.js
// Responsabilidades:
// - Comportamento de conversação natural e humanizado para vendas
// - Gestão de contexto de sessão (memória de curto prazo)
// - Leitura segura de produtos (sem vazar dados sensíveis ou técnicos)
// - Respostas dinâmicas baseadas no estado da conversa

(function(){
  if (window.AssistIA && window.AssistIA.ai) return; // Evita carregamento duplicado

  const LS_PRODUCTS = 'assistia_products';

  // --- Utilitários ---
  const nowISO = () => new Date().toISOString();
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const formatMoney = (val) => Number(val).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

  // --- Acesso a Dados (Somente Leitura) ---
  const loadProducts = () => {
    try {
      const raw = localStorage.getItem(LS_PRODUCTS);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { 
      console.error('AssistIA: Erro ao carregar produtos.', e); 
      return []; 
    }
  }

  // --- Motor de Busca Interno ---
  const buscarProdutoParaIA = (query) => {
    if (!query || typeof query !== 'string') return null;
    const q = query.trim().toLowerCase();
    const prods = loadProducts().filter(p => p.ativo !== false);
    
    // 1. Busca exata
    let found = prods.find(p => p.nome && p.nome.toLowerCase() === q);
    if (found) return found;
    
    // 2. Busca parcial (contém)
    found = prods.find(p => p.nome && p.nome.toLowerCase().includes(q));
    if (found) return found;
    
    // 3. Busca por tokens
    const tokens = q.split(/\s+/).filter(t => t.length > 2); // Ignora preposições curtas
    for (let t of tokens) {
      found = prods.find(p => (p.nome || '').toLowerCase().includes(t));
      if (found) return found;
    }
    return null;
  }

  // --- Tradutor de Estoque (Nunca retorna números) ---
  const avaliarEstoque = (produto) => {
    const qtd = Number(produto?.quantidade_estoque) || 0;
    const minimo = Number(produto?.estoque_minimo) || 2;
    
    if (qtd <= 0) return 'indisponivel';
    if (qtd <= minimo) return 'acabando';
    return 'disponivel';
  }

  // --- Gerenciamento de Sessão (Contexto) ---
  const __sessions = window.__AssistIASessions = window.__AssistIASessions || {};

  const getSession = (sessionId = 'default') => {
    if (!__sessions[sessionId]) {
      __sessions[sessionId] = {
        id: sessionId,
        lastProductId: null,
        lastProductName: null,
        expecting: null, // Pode ser: 'tamanho', 'confirmacao_compra'
        turns: []
      };
    }
    return __sessions[sessionId];
  }

  const resolveContextualProduct = (msg, session) => {
    // Tenta encontrar um novo produto na mensagem atual
    const novoProduto = buscarProdutoParaIA(msg);
    if (novoProduto) return novoProduto;

    // Se não encontrou, tenta puxar da memória da sessão
    if (session.lastProductId) {
      const prods = loadProducts();
      return prods.find(p => p.id === session.lastProductId) || null;
    }
    return null;
  }

  // --- Interpretador de Intenção Contextual ---
  const detectIntent = (msg, session) => {
    const txt = (msg || '').trim().toLowerCase();
    if (!txt) return 'vazio';

    // Se a IA perguntou o tamanho e o cliente mandou algo curto, é resposta de tamanho.
    if (session.expecting === 'tamanho' && (txt.length <= 3 || /^(p|m|g|pp|gg|[0-9]{2})$/.test(txt))) {
      return 'informou_tamanho';
    }

    if (/quantas|quantidade|quantos|estoque|restam/.test(txt)) return 'pergunta_quantidade';
    if (/quanto custa|preço|custa|valor/.test(txt)) return 'pedir_preco';
    if (/quero|comprar|reservar|carrinho|adicionar|levar|pedir/.test(txt)) return 'pedido_compra';
    if (/tem|temos|disponivel|disponível/.test(txt)) return 'consulta_disponibilidade';
    if (/cor|cores|material|tecido|garantia/.test(txt)) return 'especificacao_tecnica';
    if (/tamanho|tamanhos|numeração|medida/.test(txt)) return 'pergunta_tamanho';
    
    // Respostas curtas de confirmação/negação
    if (/^(sim|não|nao|ok|ta|tá|pode ser|quero sim)$/.test(txt)) return 'resposta_curta';

    return 'conversa_geral_ou_busca';
  }

  // --- Gerador de Respostas Dinâmicas (Humanizadas) ---
  const gerarResposta = (intent, produto, msgOriginal, session) => {
    const estadoEstoque = produto ? avaliarEstoque(produto) : null;
    
    switch (intent) {
      case 'vazio':
        return rand(['Posso ajudar com algo?', 'Oi! Como posso te ajudar hoje?']);

      case 'informou_tamanho':
        const tamanhoEscolhido = msgOriginal.toUpperCase();
        session.expecting = 'confirmacao_compra';
        if (estadoEstoque === 'indisponivel') {
          session.expecting = null;
          return `Poxa, acabei de checar e no momento estamos sem a ${produto.nome} no estoque. Quer que eu te mostre outras opções?`;
        }
        return rand([
          `Maravilha. Anotei aqui o tamanho ${tamanhoEscolhido}. Posso adicionar a ${produto.nome} ao seu pedido?`,
          `Perfeito! Temos sim. Quer que eu já reserve o tamanho ${tamanhoEscolhido} para você?`
        ]);

      case 'pergunta_quantidade':
      case 'consulta_disponibilidade':
        if (!produto) {
          return 'Claro, posso verificar! Mas de qual modelo você está falando?';
        }
        if (estadoEstoque === 'indisponivel') {
          return `No momento a ${produto.nome} esgotou 😕 Quer dar uma olhada em modelos parecidos?`;
        }
        if (estadoEstoque === 'acabando') {
          session.expecting = 'tamanho';
          return rand([
            `Temos sim, mas restam poucas unidades dessa. Qual tamanho você precisa? Já verifico se tem o seu.`,
            `Tem disponibilidade sim, mas está saindo rápido. Que tamanho ou cor você prefere?`
          ]);
        }
        session.expecting = 'tamanho';
        return rand([
          `Temos disponibilidade sim 😊 Qual tamanho você procura?`,
          `Tem sim! Você prefere em qual tamanho para eu separar pra você?`
        ]);

      case 'pedir_preco':
        if (!produto) return 'Me diz qual produto você gostou para eu checar o valor para você.';
        if (produto.preco) {
          return rand([
            `A ${produto.nome} sai por ${formatMoney(produto.preco)}. Quer que eu adicione ao carrinho?`,
            `O valor dela é ${formatMoney(produto.preco)}. Gostou? Podemos dar andamento ao pedido se quiser.`
          ]);
        }
        return 'Vou confirmar o valor exato dela para você num instante, tudo bem?';

      case 'pedido_compra':
        if (!produto) return 'Legal! Qual produto exatamente você quer levar?';
        if (estadoEstoque === 'indisponivel') {
          return `Infelizmente a ${produto.nome} está indisponível no momento. Posso te ajudar a encontrar uma alternativa?`;
        }
        session.expecting = 'tamanho';
        return `Ótima escolha! Para continuarmos, qual seria o tamanho?`;

      case 'especificacao_tecnica':
        if (!produto) return 'Você pode me dar mais detalhes de qual modelo está procurando?';
        
        const txtLimpo = msgOriginal.toLowerCase();
        if (txtLimpo.includes('cor') || txtLimpo.includes('cores')) {
          return produto.cor ? `Esse modelo temos na cor ${produto.cor}. Gosta dessa?` : `Vou confirmar direitinho as cores disponíveis e já te falo.`;
        }
        if (txtLimpo.includes('material') || txtLimpo.includes('tecido')) {
          return produto.material ? `O material dela é ${produto.material}. É super confortável!` : `Vou verificar na ficha técnica o tecido exato para não te passar informação errada, um minuto.`;
        }
        return 'Vou verificar essa informação para você!';

      case 'resposta_curta':
        if (session.expecting === 'confirmacao_compra' && /^(sim|ok|ta|tá|pode ser|quero sim)$/.test(msgOriginal.toLowerCase())) {
          session.expecting = null;
          return `Combinado! Tudo certo para o seu pedido da ${produto.nome}. Tem mais alguma coisa que você precisa hoje?`;
        }
        return 'Entendi. Como mais posso te ajudar?';

      default: // conversa_geral_ou_busca
        if (produto) {
          session.expecting = 'tamanho';
          return rand([
            `Ah, a ${produto.nome} é excelente. Qual tamanho você veste?`,
            `Encontrei aqui a ${produto.nome}. Você prefere ela em qual tamanho?`
          ]);
        }
        return rand([
          'Você poderia me dar mais detalhes do que está procurando?',
          'Qual modelo exatamente chamou sua atenção?'
        ]);
    }
  }

  // --- Processador Principal (Pipeline) ---
  const processUserMessage = (rawMsg, sessionId = 'default') => {
    const msg = (rawMsg || '').trim();
    const session = getSession(sessionId);

    // 1. Atualiza histórico do usuário
    session.turns.push({ role: 'user', text: msg, at: nowISO() });

    // 2. Resolve o produto (via texto ou contexto)
    let produtoAtual = resolveContextualProduct(msg, session);
    if (produtoAtual) {
      session.lastProductId = produtoAtual.id;
      session.lastProductName = produtoAtual.nome;
    }

    // 3. Detecta a intenção baseada no momento da conversa
    const intent = detectIntent(msg, session);

    // 4. Gera a resposta de forma orgânica
    const reply = gerarResposta(intent, produtoAtual, msg, session);

    // 5. Atualiza o histórico do assistente
    session.turns.push({ role: 'ai', text: reply, at: nowISO() });

    return { reply, session };
  }

  // --- Exposição da API ---
  window.AssistIA = window.AssistIA || {};
  window.AssistIA.ai = {
    processUserMessage,
    detectIntent,
    resolveContextualProduct,
    avaliarEstoque,
    buscarProdutoParaIA,
    getSession
  };

  console.info('AssistIA AI module loaded (v2 - Humanized & Secure).');
})();
