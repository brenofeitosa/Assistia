# AssistIA Sales - Beta 1 🚀

> "Transforme seu WhatsApp em um vendedor que trabalha 24 horas por dia."

## 🎯 Proposta do Produto
O **AssistIA Sales** é uma plataforma SaaS focada no mercado de produtos digitais (cursos, e-books, mentorias) desenhada para converter conversas no WhatsApp em vendas automáticas e recuperar leads indecisos.

---

## 🛠️ Funcionalidades da Beta 1

1. **Dashboard Focado em ROI**: Métricas financeiras em tempo real (Vendas Hoje, Vendas por IA, Vendas Recuperadas, Taxa de Conversão).
2. **Importação de Ofertas com IA**: Cole o texto da página de vendas e a IA fará o extraimento automático de Nome, Preço, Descrição e Checkout.
3. **Simulador de Vendedor IA**: Motor local de conversação focado em conduzir a jornada do cliente (Dúvida -> Qualificação -> Objeção -> Fechamento).
4. **Recuperação de Vendas**: Painel que captura leads que receberam o checkout e permite simular/executar fluxos de recuperação.
5. **Arquitetura Pronta para Produção**: Separação clara de responsabilidades (HTML, CSS e Módulos JS em camada de dados com LocalStorage).

---

## 🧪 Validação dos Testes Obrigatórios

- **TESTE 1 (Importar Oferta)**: Acessar "Produtos" -> "Importar Oferta com IA" -> Colar a copy do curso -> Verificar parsing e prévia.
- **TESTE 2 (Simulador - Preço)**: Perguntar "Quanto custa?" no Simulador -> Resposta formatada com condução para explicação.
- **TESTE 3 (Simulador - Compra)**: Escrever "Quero comprar" -> Resposta da IA com intenção detectada e link de checkout.
- **TESTE 4 (Fila de Recuperação)**: Abrir aba "Recuperação" -> Verificar presença do lead que recebeu o checkout.
- **TESTE 5 (Simular Recuperação)**: Clicar em "Simular Recuperação" -> Lead muda para "Recuperado" e o valor é contabilizado na métrica do Dashboard.

---

## 🚀 Próximos Passos (Fase 2)
- Substituir `StorageManager` por chamadas REST API Axios/Fetch.
- Conectar `AIEngine` diretamente à API da OpenAI (GPT-4o-mini).
- Integrar com API Oficial do WhatsApp Business (Evolution API / Z-API).
