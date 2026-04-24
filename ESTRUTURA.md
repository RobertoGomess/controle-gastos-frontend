# 📂 Estrutura e Documentação do Projeto

## Arquivos do Projeto

### 🎯 Arquivos Principais

#### `controle-de-gastos.html`
- **Descrição**: Arquivo HTML principal com toda a estrutura
- **Responsabilidade**: Layout, elementos DOM, formulários
- **Tamanho**: ~195 linhas
- **Referencia**: `style.css`, `config.js`, `script.js`, `https://apis.google.com/js/api.js`

#### `style.css`
- **Descrição**: Todos os estilos da aplicação
- **Responsabilidade**: CSS, variáveis de tema, animações, responsividade
- **Tamanho**: ~500+ linhas
- **Features**:
  - Variáveis CSS para cores e espaçamento
  - Tema escuro/claro automático
  - Animações suaves
  - Design responsivo (mobile, tablet, desktop)
  - Menu dropdown do Google Drive

#### `script.js`
- **Descrição**: Lógica principal da aplicação
- **Responsabilidade**: Dados, eventos, manipulação do DOM, Google Drive
- **Tamanho**: ~520+ linhas
- **Funcionalidades**:
  - Gerenciamento de despesas (CRUD)
  - Importação/exportação CSV
  - Integração com Google Drive
  - Filtros e busca
  - Alertas e notificações
  - Tema escuro/claro
  - Inicialização e setup

#### `config.js`
- **Descrição**: Configuração do Google Drive API
- **Responsabilidade**: Armazenar credenciais do Google
- **Tamanho**: ~10 linhas
- **⚠️ IMPORTANTE**: 
  - Não commitar no Git (está no .gitignore)
  - Cada usuário deve configurar suas próprias credenciais
  - Substitua `YOUR_CLIENT_ID` e `YOUR_API_KEY`

#### `gastos.csv`
- **Descrição**: Arquivo de dados (gerado automaticamente)
- **Responsabilidade**: Persistência de dados em CSV
- **Formato**: CSV com cabeçalho
- **Gerado por**: `exportCSV()` no script.js
- **⚠️ Ignorado**: Não é versionado (.gitignore)

### 📚 Arquivos de Documentação

#### `README.md`
- **Descrição**: Documentação geral do projeto
- **Conteúdo**: Features, uso básico, tecnologias, estrutura
- **Público**: Usuários finais e desenvolvedores

#### `GOOGLE_DRIVE_SETUP.md`
- **Descrição**: Guia passo a passo para configurar Google Drive
- **Conteúdo**: 
  - Como criar projeto no Google Cloud
  - Como gerar credenciais OAuth
  - Como configurar no projeto
  - Solução de problemas
- **Público**: Usuários que querem usar Google Drive

#### `QUICK_START.md`
- **Descrição**: Guia rápido de início
- **Conteúdo**: 
  - 3 passos para começar
  - Interface visual
  - Dicas e truques
  - FAQ
- **Público**: Usuários iniciantes

#### `CHANGES.md` (este arquivo)
- **Descrição**: Resumo de mudanças e implementações
- **Conteúdo**: O que foi adicionado/modificado, fluxo de dados
- **Público**: Desenvolvedores

#### `.gitignore`
- **Descrição**: Arquivo Git para ignorar commits
- **Ignora**: 
  - `gastos.csv` - dados privados
  - `config.js` - credenciais sensíveis
- **Público**: Sistema de versionamento

### 🏗️ Arquitetura

```
controle-de-gastos/
│
├── 🎨 FRONTEND
│   ├── controle-de-gastos.html      (Estrutura)
│   ├── style.css                    (Estilos)
│   └── script.js                    (Lógica)
│
├── ☁️ CONFIGURAÇÃO
│   └── config.js                    (Google Drive)
│
├── 💾 DADOS
│   └── gastos.csv                   (Persistência)
│
├── 📖 DOCUMENTAÇÃO
│   ├── README.md                    (Overview)
│   ├── GOOGLE_DRIVE_SETUP.md        (Configuração detalhada)
│   ├── QUICK_START.md               (Guia rápido)
│   ├── CHANGES.md                   (Mudanças)
│   └── ESTRUTURA.md                 (Este arquivo)
│
└── 🔧 SISTEMA
    └── .gitignore                   (Git config)
```

## Fluxo de Dados

### 1. Inicialização
```
Carrega HTML
    ↓
Carrega CSS e scripts
    ↓
Inicializa tema (localStorage)
    ↓
Inicializa Google API (async)
    ↓
Carrega dados (localStorage ou padrão)
    ↓
Renderiza interface
```

### 2. Adição de Gasto
```
Usuário preenche formulário
    ↓
Valida dados
    ↓
Adiciona ao array 'expenses'
    ↓
Salva em localStorage
    ↓
Re-renderiza lista
```

### 3. Exportação CSV
```
Converte array para CSV
    ↓
Cria Blob com conteúdo
    ↓
Cria link de download
    ↓
Triggers download
```

### 4. Google Drive Export
```
Usuário clica "Exportar para Drive"
    ↓
Valida autenticação
    ↓
Converte para CSV
    ↓
Procura arquivo existente no Drive
    ↓
Se existe: Atualiza
   Senão: Cria novo
    ↓
Mostra confirmação
```

### 5. Google Drive Import
```
Usuário clica "Importar do Drive"
    ↓
Busca 'gastos.csv' no Drive
    ↓
Se não existe: Mostra erro
   Se existe: Faz download
    ↓
Parsa CSV para array
    ↓
Substitui dados locais
    ↓
Salva em localStorage
    ↓
Re-renderiza interface
```

## Responsabilidades por Arquivo

### `controle-de-gastos.html`
- ✅ Estrutura semântica
- ✅ Formulários
- ✅ Modais
- ✅ Layout
- ✅ Inputs (file, text, number, date, select)
- ✅ Links para scripts e CSS
- ❌ Nenhuma lógica (todo em script.js)

### `style.css`
- ✅ Cores e tema
- ✅ Layout e grid
- ✅ Tipografia
- ✅ Animações
- ✅ Responsividade
- ✅ Estados (hover, active, focus)
- ❌ Nenhuma lógica

### `script.js`
- ✅ Gerenciamento de estado
- ✅ Manipulação do DOM
- ✅ Eventos
- ✅ Lógica de negócio
- ✅ Integração com APIs
- ✅ Persistência de dados
- ❌ Nenhum CSS

### `config.js`
- ✅ Credenciais
- ✅ Configurações
- ❌ Lógica
- ❌ Dados

## Variáveis Globais Importantes

```javascript
// Dados
let expenses = []                    // Array de despesas
let statusFilter = 'all'            // Filtro atual
let pendingImportData = null        // Dados temporários para import

// Estados
let panelOpen = false               // Painel aberto?
let googleUserSignedIn = false      // Usuário logado no Google?
let googleApiLoaded = false         // API carregou?

// Período
let selYear = 2024                  // Ano selecionado
let selMonth = 3                    // Mês selecionado

// Timers
let toastTimer = null               // Timer da notificação
let noticeTimer = null              // Timer da nota
```

## Estrutura de Despesa

```javascript
{
  id: 1234567890,                  // Unix timestamp ou ID único
  desc: "Aluguel",                 // Descrição
  cat: "Moradia",                  // Categoria
  val: 1200.00,                    // Valor em R$
  date: "2024-04-15",              // Data no formato YYYY-MM-DD
  status: "pending"                // "pending" ou "paid"
}
```

## Categorias Disponíveis

```
🏠 Moradia       - Casa, aluguel, condomínio
🍽️ Alimentação   - Supermercado, restaurante
🚗 Transporte    - Uber, combustível, ônibus
💊 Saúde         - Farmácia, médico, academia
🎮 Lazer         - Cinema, jogos, eventos
📚 Educação      - Cursos, livros, matrícula
📦 Outros        - Categorias diversas
```

## Status de Despesa

| Status | Significado | Cor |
|--------|-------------|-----|
| pending | Aguardando pagamento | Âmbar 🟡 |
| paid | Já foi pago | Verde 🟢 |
| overdue | Venceu e não foi pago | Vermelho 🔴 |

*Nota: "overdue" é calculado baseado na data, não é um status direto*

## Filtros Disponíveis

- **Todos** - Mostra todas as despesas
- **Pendentes** - Apenas "pending" e "overdue"
- **Pagos** - Apenas "paid"
- **Vencidos** - Apenas "overdue" (vencidas)

## Temas

- **Light** - Claro, cores neutras (padrão)
- **Dark** - Escuro, cores inversas
- Tema é salvo em localStorage

## Persistência

### LocalStorage (Navegador)
- Chave: `gastos_ctrl_v2`
- Formato: JSON stringificado
- Sincronização: Toda mudança

### Google Drive
- Nome: `gastos.csv`
- Formato: CSV com cabeçalho
- Sincronização: Manual (click)

### CSV Export/Import
- Nome sugerido: `gastos.csv`
- Formato: RFC 4180 (com quotes)
- Delimitador: Vírgula
- Encoding: UTF-8 com BOM

## APIs Utilizadas

### Google Drive API v3
- Endpoints:
  - `drive.files.list()` - Listar arquivos
  - `drive.files.get()` - Download de arquivo
  - `drive.files.create()` - Criar arquivo
  - `drive.files.update()` - Atualizar arquivo

### Google Auth 2.0
- OAuth 2.0 para autenticação
- Scopes: `drive.file` (apenas arquivos criados pelo app)

### LocalStorage API
- `localStorage.getItem(key)`
- `localStorage.setItem(key, value)`

## Constantes Importantes

```javascript
const MONTHS = [...]                  // Nomes dos meses em português
const STORAGE_KEY = 'gastos_ctrl_v2' // Chave do localStorage
const CSV_HEADER = '...'              // Cabeçalho do CSV
const GOOGLE_DRIVE_FILENAME = '...'   // Nome do arquivo no Drive
```

## Eventos

### Teclado
- `Enter` - Adiciona despesa (se painel aberto)
- `Escape` - Fecha modal

### Mouse
- Click em status badge - Alterna status
- Click em botão delete - Remove despesa
- Click fora de menu - Fecha menu

### Mudanças
- Ano/mês selecionado - Re-renderiza lista
- Filtro - Re-renderiza lista

---

**Este documento fornece uma visão geral técnica do projeto.**

Para uso prático, consulte:
- [README.md](README.md) - Visão geral
- [QUICK_START.md](QUICK_START.md) - Como começar
- [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md) - Configuração do Drive
