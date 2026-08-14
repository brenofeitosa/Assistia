// AssistIA - Frontend data + AI logic (localStorage)
// File: assets/assistia-ai.js
// Responsibilities:
// - localStorage data layer for products and stock movements
// - UI injection: sidebar items, Produtos and Estoque views, modals
// - AI functions: buscarProdutoParaIA, consultarEstoqueParaIA, processUserMessage, handleMessage
// - registrarVenda preparation

(function(){
  if (window.AssistIA) return; // avoid double-load

  const LS_PRODUCTS = 'assistia_products';
  const LS_MOVS = 'assistia_movs';

  const uid = () => 'p_' + Math.random().toString(36).slice(2,9);
  const nowISO = () => new Date().toISOString();
  const formatCurrency = v => {
    if (v == null) return '-';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Data layer
  const loadProducts = () => {
    try{
      const raw = localStorage.getItem(LS_PRODUCTS);
      if (!raw) return [];
      return JSON.parse(raw);
    }catch(e){ console.error('loadProducts', e); return []; }
  }
  const saveProducts = (arr) => {
    localStorage.setItem(LS_PRODUCTS, JSON.stringify(arr));
  }
  const loadMovs = () => {
    try{ const raw = localStorage.getItem(LS_MOVS); if(!raw) return []; return JSON.parse(raw);}catch(e){console.error(e); return []}
  }
  const saveMovs = (arr)=> localStorage.setItem(LS_MOVS, JSON.stringify(arr));

  // Initialize seed if empty
  const seedIfNeeded = ()=>{
    const prods = loadProducts();
    if (prods.length === 0){
      const p1 = { id: uid(), nome: 'Camiseta preta', descricao: 'Camiseta básica preta', categoria: 'Roupas', preco: 59.9, quantidade_estoque: 8, estoque_minimo: 3, ativo: true, criado_em: nowISO(), atualizado_em: nowISO() };
      const p2 = { id: uid(), nome: 'Calça jeans', descricao: 'Calça jeans azul', categoria: 'Roupas', preco: 129.9, quantidade_estoque: 5, estoque_minimo: 2, ativo: true, criado_em: nowISO(), atualizado_em: nowISO() };
      saveProducts([p1,p2]);
    }
    const movs = loadMovs();
    if (movs.length === 0){ saveMovs([]); }
  }

  // Helper find / search
  const buscarProdutoPorId = (id) => {
    const prods = loadProducts();
    return prods.find(p => p.id === id) || null;
  }

  const buscarProdutoParaIA = (query) => {
    // query: string that may contain product name
    if (!query || typeof query !== 'string') return null;
    const q = query.trim().toLowerCase();
    const prods = loadProducts().filter(p=>p.ativo !== false);
    // exact name match
    let found = prods.find(p => p.nome.toLowerCase() === q);
    if (found) return found;
    // contains
    found = prods.find(p => p.nome.toLowerCase().includes(q));
    if (found) return found;
    // token match (any word)
    const tokens = q.split(/\s+/).filter(Boolean);
    for (const p of prods){
      const name = p.nome.toLowerCase();
      if (tokens.every(t => name.includes(t))) return p;
    }
    // try fuzzy by first token
    if (tokens.length){
      const t0 = tokens[0];
      found = prods.find(p => p.nome.toLowerCase().includes(t0));
      if (found) return found;
    }
    return null;
  }

  const consultarEstoqueParaIA = (produtoId) => {
    const p = buscarProdutoPorId(produtoId);
    if (!p) return null;
    const quantidade = Number(p.quantidade_estoque) || 0;
    const minimo = Number(p.estoque_minimo) || 0;
    let status = 'em_estoque';
    if (quantidade === 0) status = 'sem_estoque';
    else if (quantidade <= minimo) status = 'estoque_baixo';
    return { quantidade, estoque_minimo: minimo, status };
  }

  // Movimentações
  const registrarMovimentacao = ({produto_id, tipo, quantidade, estoque_anterior, estoque_novo, motivo}) => {
    const movs = loadMovs();
    const row = { id: uid(), produto_id, tipo, quantidade, estoque_anterior, estoque_novo, motivo: motivo||'', criado_em: nowISO() };
    movs.unshift(row);
    saveMovs(movs);
    return row;
  }

  const ajustarEstoque = (produtoId, tipo, quantidade, motivo) => {
    // tipo: 'entrada'|'saida'|'ajuste'
    if (!['entrada','saida','ajuste'].includes(tipo)) throw new Error('tipo inválido');
    quantidade = Number(quantidade);
    if (isNaN(quantidade) || quantidade <= 0) throw new Error('quantidade inválida');
    const prods = loadProducts();
    const idx = prods.findIndex(p => p.id === produtoId);
    if (idx === -1) throw new Error('produto não encontrado');
    const p = prods[idx];
    const anterior = Number(p.quantidade_estoque) || 0;
    let novo = anterior;
    if (tipo === 'entrada' || tipo === 'ajuste') novo = anterior + quantidade;
    else if (tipo === 'saida') {
      if (anterior - quantidade < 0) throw new Error('estoque insuficiente');
      novo = anterior - quantidade;
    }
    p.quantidade_estoque = novo;
    p.atualizado_em = nowISO();
    prods[idx] = p;
    saveProducts(prods);
    const mv = registrarMovimentacao({produto_id: produtoId, tipo, quantidade, estoque_anterior: anterior, estoque_novo: novo, motivo});
    return { produto: p, movimentacao: mv };
  }

  const registrarVenda = (produtoId, quantidade) => {
    // returns { success: boolean, message, data }
    try{
      quantidade = Number(quantidade);
      if (!Number.isInteger(quantidade) || quantidade <= 0) return { success:false, message: 'Quantidade inválida' };
      const p = buscarProdutoPorId(produtoId);
      if (!p) return { success:false, message: 'Produto não encontrado' };
      const anterior = Number(p.quantidade_estoque) || 0;
      if (anterior < quantidade) return { success:false, message: 'Estoque insuficiente' };
      const res = ajustarEstoque(produtoId, 'saida', quantidade, 'venda');
      return { success:true, data: res };
    }catch(e){ return { success:false, message: e.message } }
  }

  // Simple UI injection for navigation and views (Produtos / Estoque)
  const ensureSidebarNav = ()=>{
    const sidebarNav = document.querySelector('.sidebar-nav ul');
    if (!sidebarNav) return null;
    // check if already has produtos link
    if (!sidebarNav.querySelector('[data-view-target="produtos"]')){
      const li = document.createElement('li'); li.className='nav-item';
      li.innerHTML = '<a href="#" class="nav-link" data-view-target="produtos">Produtos</a>';
      sidebarNav.appendChild(li);
    }
    if (!sidebarNav.querySelector('[data-view-target="estoque"]')){
      const li = document.createElement('li'); li.className='nav-item';
      li.innerHTML = '<a href="#" class="nav-link" data-view-target="estoque">Estoque</a>';
      sidebarNav.appendChild(li);
    }
    return sidebarNav;
  }

  const createProductsView = ()=>{
    const container = document.querySelector('.view-container');
    if (!container) return null;
    if (container.querySelector('[data-view="produtos"]')) return; // already exists
    const div = document.createElement('div'); div.className='view-content'; div.setAttribute('data-view','produtos');
    div.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Produtos</h3>
            <div class="card-subtitle">Gerencie os produtos do estabelecimento</div>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-open-add-prod">Adicionar produto</button>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Quantidade</th>
                  <th>Estoque mínimo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="produtos-list"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    container.appendChild(div);
  }

  const createEstoqueView = ()=>{
    const container = document.querySelector('.view-container');
    if (!container) return null;
    if (container.querySelector('[data-view="estoque"]')) return;
    const div = document.createElement('div'); div.className='view-content'; div.setAttribute('data-view','estoque');
    div.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Estoque</h3>
          <div class="card-subtitle">Status e movimentações</div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Quantidade atual</th>
                  <th>Estoque mínimo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="estoque-list"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    container.appendChild(div);
  }

  // Renderers
  const statusBadgeHTML = (status)=>{
    if (status === 'em_estoque') return '<span class="badge badge-success">Em estoque</span>';
    if (status === 'estoque_baixo') return '<span class="badge badge-warning">Estoque baixo</span>';
    return '<span class="badge badge-danger">Sem estoque</span>';
  }

  const renderProdutos = ()=>{
    const tbody = document.getElementById('produtos-list');
    if (!tbody) return;
    const prods = loadProducts();
    tbody.innerHTML = '';
    for (const p of prods){
      const est = consultarEstoqueParaIA(p.id);
      const statusHtml = est ? statusBadgeHTML(est.status) : '<span class="badge badge-neutral">-</span>';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nome}</td>
        <td>${p.categoria || ''}</td>
        <td>${formatCurrency(p.preco)}</td>
        <td>${p.quantidade_estoque ?? 0}</td>
        <td>${p.estoque_minimo ?? 0}</td>
        <td>${statusHtml}</td>
        <td>
          <button class="btn btn-sm btn-light" data-action="editar" data-id="${p.id}">Editar</button>
          <button class="btn btn-sm btn-outline-warning" data-action="desativar" data-id="${p.id}">${p.ativo? 'Desativar':'Ativar'}</button>
          <button class="btn btn-sm btn-primary" data-action="ajustar" data-id="${p.id}">Ajustar estoque</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  const renderEstoque = ()=>{
    const tbody = document.getElementById('estoque-list'); if (!tbody) return;
    const prods = loadProducts().filter(p=>p.ativo!==false);
    tbody.innerHTML = '';
    for (const p of prods){
      const est = consultarEstoqueParaIA(p.id);
      const statusHtml = est ? statusBadgeHTML(est.status) : '<span class="badge badge-neutral">-</span>';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nome}</td>
        <td>${formatCurrency(p.preco)}</td>
        <td>${p.quantidade_estoque ?? 0}</td>
        <td>${p.estoque_minimo ?? 0}</td>
        <td>${statusHtml}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-action="entrada" data-id="${p.id}">+</button>
          <button class="btn btn-sm btn-secondary" data-action="saida" data-id="${p.id}">−</button>
          <button class="btn btn-sm btn-light" data-action="hist" data-id="${p.id}">Histórico</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  // Modals (simple, using existing styles)
  const createModalStructure = ()=>{
    if (document.getElementById('assistia-modals')) return;
    const div = document.createElement('div'); div.id = 'assistia-modals';
    div.innerHTML = `
      <div id="modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9998;"></div>
      <div id="modal-root" style="display:none; position:fixed; inset:0; z-index:9999; align-items:center; justify-content:center;">
        <div id="modal-box" style="background:#fff; width:640px; max-width:95%; border-radius:10px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.2);"></div>
      </div>
    `;
    document.body.appendChild(div);
  }

  const openModal = (html)=>{
    createModalStructure();
    const overlay = document.getElementById('modal-overlay');
    const root = document.getElementById('modal-root');
    const box = document.getElementById('modal-box');
    box.innerHTML = html;
    overlay.style.display = 'block'; root.style.display = 'flex';
    overlay.onclick = closeModal;
  }
  const closeModal = ()=>{
    const overlay = document.getElementById('modal-overlay');
    const root = document.getElementById('modal-root');
    const box = document.getElementById('modal-box');
    overlay.style.display = 'none'; root.style.display = 'none'; box.innerHTML = '';
  }

  const showAddProductModal = ()=>{
    openModal(`<div style="padding:20px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <h3>Adicionar produto</h3>
        <button class="btn btn-light" id="modal-close">Fechar</button>
      </div>
      <form id="form-add-prod">
        <div class="form-group"><label>Nome</label><input class="form-control" name="nome" required></div>
        <div class="form-group"><label>Descrição</label><input class="form-control" name="descricao"></div>
        <div class="form-group"><label>Categoria</label><input class="form-control" name="categoria"></div>
        <div class="form-group"><label>Preço</label><input class="form-control" name="preco" type="number" step="0.01"></div>
        <div class="form-group"><label>Quantidade em estoque</label><input class="form-control" name="quantidade_estoque" type="number"></div>
        <div class="form-group"><label>Estoque mínimo</label><input class="form-control" name="estoque_minimo" type="number"></div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px">
          <button class="btn btn-secondary" type="button" id="modal-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </div>`);
    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal-cancel').onclick = closeModal;
    const form = document.getElementById('form-add-prod');
    form.onsubmit = (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const p = { id: uid(), nome: fd.get('nome')||'', descricao: fd.get('descricao')||'', categoria: fd.get('categoria')||'', preco: Number(fd.get('preco'))||0, quantidade_estoque: Number(fd.get('quantidade_estoque'))||0, estoque_minimo: Number(fd.get('estoque_minimo'))||0, ativo:true, criado_em: nowISO(), atualizado_em: nowISO() };
      const prods = loadProducts(); prods.unshift(p); saveProducts(prods); renderProdutos(); renderEstoque(); closeModal();
    }
  }

  const showEditProductModal = (productId)=>{
    const p = buscarProdutoPorId(productId); if(!p) return alert('Produto não encontrado');
    openModal(`<div style="padding:20px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <h3>Editar produto</h3>
        <button class="btn btn-light" id="modal-close">Fechar</button>
      </div>
      <form id="form-edit-prod">
        <div class="form-group"><label>Nome</label><input class="form-control" name="nome" required value="${p.nome}"></div>
        <div class="form-group"><label>Descrição</label><input class="form-control" name="descricao" value="${p.descricao||''}"></div>
        <div class="form-group"><label>Categoria</label><input class="form-control" name="categoria" value="${p.categoria||''}"></div>
        <div class="form-group"><label>Preço</label><input class="form-control" name="preco" type="number" step="0.01" value="${p.preco}"></div>
        <div class="form-group"><label>Estoque mínimo</label><input class="form-control" name="estoque_minimo" type="number" value="${p.estoque_minimo}"></div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px">
          <button class="btn btn-secondary" type="button" id="modal-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </div>`);
    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal-cancel').onclick = closeModal;
    const form = document.getElementById('form-edit-prod');
    form.onsubmit = (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const prods = loadProducts();
      const idx = prods.findIndex(x=>x.id===productId); if (idx===-1) return alert('Produto não encontrado');
      prods[idx].nome = fd.get('nome')||prods[idx].nome;
      prods[idx].descricao = fd.get('descricao')||prods[idx].descricao;
      prods[idx].categoria = fd.get('categoria')||prods[idx].categoria;
      prods[idx].preco = Number(fd.get('preco'))||prods[idx].preco;
      prods[idx].estoque_minimo = Number(fd.get('estoque_minimo'))||prods[idx].estoque_minimo;
      prods[idx].atualizado_em = nowISO();
      saveProducts(prods); renderProdutos(); renderEstoque(); closeModal();
    }
  }

  const showAjusteModal = (productId, tipo)=>{
    const p = buscarProdutoPorId(productId); if(!p) return alert('Produto não encontrado');
    const title = tipo === 'entrada' ? 'Adicionar estoque' : 'Diminuir estoque';
    openModal(`<div style="padding:20px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <h3>${title} — ${p.nome}</h3>
        <button class="btn btn-light" id="modal-close">Fechar</button>
      </div>
      <form id="form-ajuste">
        <div class="form-group"><label>Quantidade</label><input class="form-control" name="quantidade" type="number" required></div>
        <div class="form-group"><label>Motivo</label><input class="form-control" name="motivo"></div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px">
          <button class="btn btn-secondary" type="button" id="modal-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit">Confirmar</button>
        </div>
      </form>
    </div>`);
    document.getElementById('modal-close').onclick = closeModal;
    document.getElementById('modal-cancel').onclick = closeModal;
    document.getElementById('form-ajuste').onsubmit = (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const qtd = Number(fd.get('quantidade'))||0; const motivo = fd.get('motivo')||'';
      try{
        ajustarEstoque(productId, tipo, qtd, motivo);
        renderProdutos(); renderEstoque(); closeModal();
      }catch(err){ alert(err.message || 'Erro'); }
    }
  }

  const showHistoricoModal = (productId)=>{
    const p = buscarProdutoPorId(productId); if(!p) return alert('Produto não encontrado');
    const movs = loadMovs().filter(m=>m.produto_id === productId);
    let rows = '';
    for (const m of movs){
      rows += `<tr><td>${new Date(m.criado_em).toLocaleString()}</td><td>${m.tipo}</td><td>${m.quantidade}</td><td>${m.estoque_anterior}</td><td>${m.estoque_novo}</td><td>${m.motivo||''}</td></tr>`;
    }
    openModal(`<div style="padding:20px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <h3>Histórico — ${p.nome}</h3>
        <button class="btn btn-light" id="modal-close">Fechar</button>
      </div>
      <div style="max-height:400px; overflow:auto">
        <table class="table">
          <thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Est. Ant.</th><th>Est. Novo</th><th>Motivo</th></tr></thead>
          <tbody>${rows||'<tr><td colspan="6">Sem movimentações</td></tr>'}</tbody>
        </table>
      </div>
    </div>`);
    document.getElementById('modal-close').onclick = closeModal;
  }

  // Delegation for actions in tables
  const tableClickHandler = (e)=>{
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const act = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (act === 'editar') showEditProductModal(id);
    else if (act === 'desativar'){
      const prods = loadProducts(); const idx = prods.findIndex(p=>p.id===id); if (idx===-1) return;
      prods[idx].ativo = !prods[idx].ativo; prods[idx].atualizado_em = nowISO(); saveProducts(prods); renderProdutos(); renderEstoque();
    } else if (act === 'ajustar'){
      showAjusteModal(id, 'entrada');
    }
  }

  const estoqueClickHandler = (e)=>{
    const btn = e.target.closest('button[data-action]'); if(!btn) return;
    const act = btn.getAttribute('data-action'); const id = btn.getAttribute('data-id');
    if (act === 'entrada') showAjusteModal(id, 'entrada');
    else if (act === 'saida') showAjusteModal(id, 'saida');
    else if (act === 'hist') showHistoricoModal(id);
  }

  // View navigation
  const setupViewNavigation = ()=>{
    const sidebar = ensureSidebarNav();
    if (!sidebar) return;
    sidebar.addEventListener('click', (e)=>{
      const a = e.target.closest('[data-view-target]');
      if (!a) return;
      e.preventDefault();
      const target = a.getAttribute('data-view-target');
      document.querySelectorAll('.view-content').forEach(v=>v.classList.remove('active'));
      const view = document.querySelector(`.view-content[data-view="${target}"]`);
      if (view) view.classList.add('active');
      // mark active in sidebar
      sidebar.querySelectorAll('li').forEach(li=>li.classList.remove('active'));
      const li = a.closest('li'); if (li) li.classList.add('active');
    });
  }

  // AI conversation engine (lightweight)
  const ai = {};
  ai.processUserMessage = (text, context={})=>{
    // returns { reply, context }
    text = (text||'').trim();
    if (!text) return { reply: '', context };
    const lc = text.toLowerCase();

    // intents detection
    const isPriceQ = /quanto(s| custa|ta| é| está)|preço|valor/i.test(text);
    const isAvailabilityQ = /\b(tem|têm|disponiv|disponible|possui|há)\b/i.test(text) && /\b(tem|têm|vocês|?)/i.test(text) || /tem\b/i.test(text) && /\w+/.test(text);
    const isQuantityQ = /quant(a|as|os)|quantidade|quantos|quantas/i.test(text) || /^quantas?$|^quantos?$/i.test(lc);

    // try to find product mentioned
    let prod = null;
    // if context has lastProductId, and user used a short query like 'quanto?' or 'quantas?'
    if (context.lastProductId && (/^quanto\b|^quantas?\b|^quantos?\b|^preço\b|^valor\b/i.test(text) || lc==='quanto' || lc==='quantas' || lc==='quantos')){
      prod = buscarProdutoPorId(context.lastProductId);
    }
    if (!prod){
      // try extract product name from text by removing common verbs
      // naive: try phrases in quotes or full string
      // try buscarProdutoParaIA directly with whole text
      prod = buscarProdutoParaIA(text);
    }

    // If product not found and user asks about availability/price, respond naturally to escalate
    if (!prod){
      if (isAvailabilityQ || isPriceQ || isQuantityQ) return { reply: 'Vou confirmar essa informação pra você — quer que eu encaminhe para um atendente?', context };
      return { reply: 'Desculpe, não entendi direito — pode reformular?', context };
    }

    // we have product
    context.lastProductId = prod.id;
    const estoque = consultarEstoqueParaIA(prod.id);

    // handle price question
    if (isPriceQ) return { reply: `${prod.nome} está ${formatCurrency(prod.preco)} 😊`, context };

    // handle quantity question
    if (isQuantityQ) return { reply: `Temos ${estoque.quantidade} unidades no momento.`, context };

    // handle availability
    if (isAvailabilityQ){
      if (estoque.status === 'sem_estoque') return { reply: 'No momento acabou 😕. Se quiser, posso deixar anotado para avisar quando chegar novamente.', context };
      if (estoque.status === 'estoque_baixo') return { reply: 'Temos sim 😊 Ainda temos algumas unidades disponíveis.', context };
      return { reply: 'Temos sim 😊 Qual tamanho você procura?', context };
    }

    // fallback: if message contains product name but not clear intent, give short summary
    return { reply: `${prod.nome}: ${prod.descricao||''}. Preço: ${formatCurrency(prod.preco)}. Temos ${estoque.quantidade} em estoque.`, context };
  }

  ai.handleMessage = async (text) => {
    const ctx = window.AssistIA._context || {};
    const res = ai.processUserMessage(text, ctx);
    window.AssistIA._context = res.context;
    return res.reply;
  }

  // Wire up UI and events
  const setupUI = ()=>{
    seedIfNeeded();
    createProductsView(); createEstoqueView(); createModalStructure();
    setupViewNavigation();
    // default open produtos
    const prodView = document.querySelector('.view-content[data-view="produtos"]'); if (prodView) prodView.classList.add('active');
    // attach handlers
    document.addEventListener('click', tableClickHandler);
    document.addEventListener('click', estoqueClickHandler);
    document.getElementById('btn-open-add-prod')?.addEventListener('click', (e)=>{ e.preventDefault(); showAddProductModal(); });
    renderProdutos(); renderEstoque();
  }

  // Expose public API
  window.AssistIA = {
    data: {
      loadProducts, saveProducts, loadMovs, saveMovs, listarProdutos: loadProducts, listarMovimentacoes: loadMovs,
      buscarProdutoParaIA, consultarEstoqueParaIA, ajustarEstoque, registrarMovimentacao, registrarVenda
    },
    ai: ai,
    _context: {},
    ui: { renderProdutos, renderEstoque }
  };

  // auto init when DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupUI);
  else setupUI();

})();
