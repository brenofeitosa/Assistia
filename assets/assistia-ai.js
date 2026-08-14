// AssistIA - Conversational AI logic (behavior only)
// File: assets/assistia-ai.js
// Responsibilities:
// - Natural, human-like conversational behavior for product inquiries
// - Session context management (in-memory, per-sessionId)
// - Uses localStorage 'assistia_products' as the data source (read-only)
// - DOES NOT reveal exact stock numbers nor technical terms

(function(){
  if (window.AssistIA && window.AssistIA.ai) return; // avoid double-load

  const LS_PRODUCTS = 'assistia_products';

  // Utilities
  const nowISO = () => new Date().toISOString();
  const rand = (arr) => arr[Math.floor(Math.random()*arr.length)];

  // Load products from localStorage (read-only)
  const loadProducts = () => {
    try{
      const raw = localStorage.getItem(LS_PRODUCTS);
      if (!raw) return [];
      return JSON.parse(raw);
    }catch(e){ console.error('AssistIA: loadProducts error', e); return []; }
  }

  // Product search helper (token matching, case-insensitive)
  const buscarProdutoParaIA = (query) => {
    if (!query || typeof query !== 'string') return null;
    const q = query.trim().toLowerCase();
    const prods = loadProducts().filter(p=>p.ativo !== false);
    // exact name
    let found = prods.find(p => p.nome && p.nome.toLowerCase() === q);
    if (found) return found;
    // contains
    found = prods.find(p => p.nome && p.nome.toLowerCase().includes(q));
    if (found) return found;
    // token match
    const tokens = q.split(/\s+/).filter(Boolean);
    for (let t of tokens){
      found = prods.find(p => (p.nome||'').toLowerCase().split(/\s+/).includes(t));
      if (found) return found;
    }
    return null;
  }

  // Stock evaluation (internal only)
  const avaliarEstoque = (produto) => {
    // produto: { quantidade_estoque, estoque_minimo }
    const qtd = Number(produto && produto.quantidade_estoque) || 0;
    const minimo = (produto && Number(produto.estoque_minimo)) || 2;
    if (qtd <= 0) return 'indisponivel';
    if (qtd <= minimo) return 'acabando';
    return 'disponivel';
  }

  // Intent detection (heuristics, Portuguese)
  const detectIntent = (msg, session) => {
    const t = (msg||'').trim().toLowerCase();
    if (!t) return { name: 'empty' };

    // direct quantity question
    if (/quantas|quantidade|quantos|quantas unidades|quantos tem|quantas tem/.test(t)) return { name: 'pergunta_quantidade' };
    // price
    if (/quanto custa|preço|custa|valor/.test(t)) return { name: 'pedir_preco' };
    // buy / reserve
    if (/quero|comprar|reservar|coloca no carrinho|adiciona|comprar agora|vou levar|me vender|faça o pedido|faça minha compra/.test(t)) return { name: 'pedido_compra' };
    // availability question
    if (/tem|temos|disponivel|disponível|tem disponível|tem essa|tem esse|tem esse produto/.test(t)) return { name: 'consulta_disponibilidade' };
    // size colors
    if (/^p$|^m$|^g$|^(pp|gg)$|tamanho|tamanhos|numeração|42|40|44|38/.test(t)) return { name: 'especificacao' };
    // asking about characteristic
    if (/cor|material|tecido|tamanho|medida|garantia|modelo|marca/.test(t)) return { name: 'especificacao' };
    // short reply likely to be contextual (e.g., "M", "sim", "não")
    if (t.length <= 3 || ['sim','não','nao','ok','ta','tá'].includes(t)) return { name: 'resposta_curta' };

    // default: could be product identification or general question
    return { name: 'identificar_produto' };
  }

  // Templates (variants) - ensure none contain forbidden phrases or numbers
  const TEMPLATES = {
    disponivel: [
      'Tem sim 😊 Qual tamanho você procura?',
      'Tem sim. Que tamanho você prefere? Posso separar pra você.',
      'Sim — está disponível. Você prefere P, M ou G?'
    ],
    acabando: [
      'Tem sim, mas são poucas unidades. Se quiser, já posso te ajudar com o pedido.',
      'Tem disponibilidade, porém está acabando. Quer que eu reserve para você?'
    ],
    indisponivel: [
      'No momento está indisponível 😕 Posso te mostrar outra opção?',
      'Agora está indisponível. Quer que eu traga alternativas parecidas?'
    ],
    pergunta_quantidade: [
      'Tem disponibilidade sim. Se quiser, já posso te ajudar a fazer o pedido.',
      'Há disponibilidade — quer que eu verifique agora e te auxilie com o pedido?'
    ],
    pedir_preco: [
      (p) => p.preco ? `Essa ${p.nome} custa R$ ${Number(p.preco).toLocaleString('pt-BR', {minimumFractionDigits:2})}. Quer que eu adicione ao carrinho?` : 'Vou confirmar essa informação para você 😊 Quer que eu já te mostre opções parecidas enquanto confirmo?'
    ],
    falta_info: [
      'Vou confirmar essa informação para você 😊',
      'Posso confirmar isso pra você. Quer que eu já te mostre opções enquanto confirmo?'
    ],
    pedir_clarificacao: [
      'Qual modelo exatamente você quer? A camiseta preta básica ou outra?',
      'Você pode me dizer um pouco mais — qual modelo ou cor você procura?'
    ]
  };

  // small helper to choose template and avoid repetition (simple rotation per session)
  const chooseTemplate = (key, product, session) => {
    const arr = TEMPLATES[key] || [];
    if (!arr.length) return '';
    // if function variant
    const pick = rand(arr);
    return (typeof pick === 'function') ? pick(product) : pick;
  }

  // Session context management (in-memory, per sessionId)
  const __sessions = window.__AssistIASessions = window.__AssistIASessions || {};

  const getSession = (sessionId='default') => {
    if (!__sessions[sessionId]){
      __sessions[sessionId] = {
        id: sessionId,
        lastProductId: null,
        lastProductName: null,
        lastIntent: null,
        expecting: null, // 'tamanho', 'confirmar_compra', etc.
        turns: []
      };
    }
    return __sessions[sessionId];
  }

  // Resolve product: try message, then context
  const resolveProduct = (msg, session) => {
    const byMsg = buscarProdutoParaIA(msg || '');
    if (byMsg) return byMsg;
    if (session && session.lastProductId){
      // try load by id
      const prods = loadProducts();
      const p = prods.find(x=>x.id === session.lastProductId);
      if (p) return p;
    }
    return null;
  }

  // Main processing function
  const processUserMessage = (rawMsg, sessionId='default') => {
    const msg = (rawMsg||'').trim();
    const session = getSession(sessionId);

    // update history
    session.turns.push({ role: 'user', text: msg, at: nowISO() });

    const intent = detectIntent(msg, session);
    session.lastIntent = intent.name;

    // If empty
    if (intent.name === 'empty'){
      const reply = 'Posso ajudar com algo?';
      session.turns.push({ role:'ai', text: reply, at: nowISO() });
      return { reply, session };
    }

    // If user asks quantity, always use safe reply
    if (intent.name === 'pergunta_quantidade'){
      const reply = chooseTemplate('pergunta_quantidade', null, session);
      session.expecting = null;
      session.turns.push({ role:'ai', text: reply, at: nowISO() });
      return { reply, session };
    }

    // Try to resolve product
    let produto = resolveProduct(msg, session);

    // If intent is identify product and no product found -> ask clarifying
    if (!produto && intent.name === 'identificar_produto'){
      const reply = chooseTemplate('pedir_clarificacao', null, session);
      session.turns.push({ role:'ai', text: reply, at: nowISO() });
      return { reply, session };
    }

    // If intent is especificacao and msg short and expecting field set -> map to that attribute
    if (session.expecting === 'tamanho' && intent.name === 'resposta_curta'){
      // user answered size for last product
      const size = msg;
      // Confirm naturally (do not invent stock number)
      if (session.lastProductId){
        const prods = loadProducts();
        const p = prods.find(x=>x.id === session.lastProductId);
        if (p){
          const stockState = avaliarEstoque(p);
          if (stockState === 'indisponivel'){
            const reply = chooseTemplate('indisponivel', p, session);
            session.expecting = null;
            session.turns.push({ role:'ai', text: reply, at: nowISO() });
            return { reply, session };
          }
          if (stockState === 'acabando'){
            const reply = chooseTemplate('acabando', p, session);
            session.expecting = null;
            session.turns.push({ role:'ai', text: reply, at: nowISO() });
            return { reply, session };
          }
          // available
          const reply = `Perfeito — temos essa ${p.nome} no tamanho ${size}. Quer que eu coloque no seu pedido?`;
          session.expecting = 'confirmar_compra';
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
      }
      // fallback
      const reply = 'Entendi. Quer que eu procure esse tamanho para você?';
      session.turns.push({ role:'ai', text: reply, at: nowISO() });
      return { reply, session };
    }

    // If produto identified now, store in session
    if (produto){
      session.lastProductId = produto.id;
      session.lastProductName = produto.nome;
    }

    // Handle intents
    switch(intent.name){
      case 'consulta_disponibilidade':{
        if (!produto){
          const reply = chooseTemplate('pedir_clarificacao', null, session);
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        const state = avaliarEstoque(produto);
        if (state === 'disponivel'){
          const reply = chooseTemplate('disponivel', produto, session);
          session.expecting = 'tamanho';
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        if (state === 'acabando'){
          const reply = chooseTemplate('acabando', produto, session);
          session.expecting = 'tamanho';
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        // indisponivel
        const reply = chooseTemplate('indisponivel', produto, session);
        session.expecting = null;
        session.turns.push({ role:'ai', text: reply, at: nowISO() });
        return { reply, session };
      }

      case 'pedir_preco':{
        if (!produto){
          const reply = 'Qual produto você quer saber o preço?';
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        const reply = chooseTemplate('pedir_preco', produto, session);
        session.turns.push({ role:'ai', text: reply, at: nowISO() });
        return { reply, session };
      }

      case 'pedido_compra':{
        if (!produto){
          const reply = 'Qual produto você quer comprar?';
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        const state = avaliarEstoque(produto);
        if (state === 'indisponivel'){
          const reply = chooseTemplate('indisponivel', produto, session);
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        if (state === 'acabando'){
          const reply = chooseTemplate('acabando', produto, session);
          session.expecting = 'tamanho';
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        // available -> ask size / confirm
        const reply = chooseTemplate('disponivel', produto, session);
        session.expecting = 'tamanho';
        session.turns.push({ role:'ai', text: reply, at: nowISO() });
        return { reply, session };
      }

      case 'especificacao':{
        // user asks size/color/etc. If product present and attribute exists, answer; otherwise confirm
        if (!produto){
          const reply = chooseTemplate('pedir_clarificacao', null, session);
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        // simple attribute detection
        if (/cor/.test(msg.toLowerCase())){
          if (produto.cor) return { reply: `A cor disponível é ${produto.cor}.`, session };
          return { reply: chooseTemplate('falta_info', produto, session), session };
        }
        if (/garantia|material|tecido/.test(msg.toLowerCase())){
          // check known attributes
          if (produto.material) return { reply: `O material é ${produto.material}.`, session };
          return { reply: chooseTemplate('falta_info', produto, session), session };
        }
        // size or short value may be captured by contexto
        if (/^p$|^m$|^g$|pp|gg|\b[0-9]{2}\b/.test(msg.toLowerCase())){
          // handle like resposta_curta
          session.expecting = null; // handled earlier in specific block; fallback
          const reply = `Entendi. Você quer esse tamanho — quer que eu adicione ao pedido?`;
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        // default
        return { reply: chooseTemplate('falta_info', produto, session), session };
      }

      case 'resposta_curta':{
        // short response: try to map to context
        if (session.expecting === 'tamanho'){
          // delegate to earlier handler by re-running with especificacao
          session.turns.push({ role:'ai', text: 'Entendi.' , at: nowISO() });
          return processUserMessage(msg, sessionId);
        }
        // else small acknowledgment
        const reply = 'Beleza — quer que eu te ajude em algo mais?';
        session.turns.push({ role:'ai', text: reply, at: nowISO() });
        return { reply, session };
      }

      default: {
        // fallback: if product known, respond about availability
        if (produto){
          const state = avaliarEstoque(produto);
          if (state === 'disponivel'){
            const reply = chooseTemplate('disponivel', produto, session);
            session.expecting = 'tamanho';
            session.turns.push({ role:'ai', text: reply, at: nowISO() });
            return { reply, session };
          }
          if (state === 'acabando'){
            const reply = chooseTemplate('acabando', produto, session);
            session.expecting = 'tamanho';
            session.turns.push({ role:'ai', text: reply, at: nowISO() });
            return { reply, session };
          }
          const reply = chooseTemplate('indisponivel', produto, session);
          session.turns.push({ role:'ai', text: reply, at: nowISO() });
          return { reply, session };
        }
        const reply = chooseTemplate('pedir_clarificacao', null, session);
        session.turns.push({ role:'ai', text: reply, at: nowISO() });
        return { reply, session };
      }
    }
  }

  // Expose API
  window.AssistIA = window.AssistIA || {};
  window.AssistIA.ai = {
    processUserMessage, // (msg, sessionId) => { reply, session }
    detectIntent,
    resolveProduct,
    avaliarEstoque,
    buscarProdutoParaIA,
    getSession
  };

  console.info('AssistIA AI module loaded (behavior only).');
})();
