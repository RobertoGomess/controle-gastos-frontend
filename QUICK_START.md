# 🚀 Integração com Google Drive - Guia Rápido

## O que foi adicionado?

✅ Autenticação com conta Google
✅ Botão de sincronização com Google Drive  
✅ Menu dropdown com opções de Drive
✅ Importar gastos do Google Drive
✅ Exportar gastos para Google Drive
✅ Logout da conta Google

## Como Começar Rápido (3 passos)

### 1️⃣ Configurar Credenciais

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto (ou use um existente)
3. Ative **Google Drive API**
4. Crie credenciais OAuth 2.0 (tipo "Aplicativo da Web")
5. Copie o **Client ID** e a **API Key**

### 2️⃣ Atualizar config.js

Abra o arquivo `config.js` e substitua:

```javascript
const GOOGLE_CONFIG = {
  clientId: 'SEU_CLIENT_ID.apps.googleusercontent.com',  // ← Cole aqui
  apiKey: 'SUA_API_KEY',                                   // ← Cole aqui
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  scopes: 'https://www.googleapis.com/auth/drive.file'
};
```

### 3️⃣ Usar a Integração

1. Abra `controle-de-gastos.html`
2. Clique no botão **"Google"** na barra superior
3. Faça login com sua conta Google
4. Use **"Exportar para Drive"** para salvar
5. Use **"Importar do Drive"** para carregar

## Interface 🎨

```
[Tema] [Importar] [Exportar] [Google] ← Botão principal
                            ↓ (clique)
                      ┌─────────────┐
                      │ Import Drive│
                      ├─────────────┤
                      │ Export Drive│
                      ├─────────────┤
                      │   Sair      │
                      └─────────────┘
```

## Recursos 🎯

| Funcionalidade | Descrição |
|---|---|
| **Importar do Drive** | Carrega o arquivo `gastos.csv` do Google Drive |
| **Exportar para Drive** | Salva seus gastos no Google Drive |
| **Sair** | Desconecta sua conta Google |

## Dicas e Truques 💡

✨ **Backup automático**: Exporte periodicamente para o Drive
🔄 **Sincronizar**: Use em múltiplos dispositivos
🛡️ **Seguro**: Usa OAuth 2.0, suas credenciais não são armazenadas
📱 **Mobile**: Funciona em smartphones e tablets

## Perguntas Frequentes ❓

### P: Meus dados estão seguros?
**R:** Sim! Usa OAuth 2.0 e os dados são salvos no Google Drive com sua conta.

### P: Posso usar sem Google Drive?
**R:** Sim! Os botões de importar/exportar CSV locais continuam funcionando.

### P: Meus dados locais são deletados ao importar do Drive?
**R:** Sim, são substituídos. Exporte seus dados locais antes de importar do Drive.

### P: Preciso configurar algo mais?
**R:** Não, depois de configurar o `config.js`, está pronto para usar!

### P: Funciona offline?
**R:** Os dados locais funcionam offline, mas Drive requer conexão.

## Estrutura de Arquivos Atualizada

```
controle-de-gastos/
├── controle-de-gastos.html
├── style.css
├── script.js
├── config.js                    ← ⭐ Novo!
├── GOOGLE_DRIVE_SETUP.md        ← ⭐ Novo! (detalhado)
├── gastos.csv
└── .gitignore
```

## Próximos Passos 🚀

Depois de configurar:

1. **Primeiro uso**: Clique em "Google" e faça login
2. **Teste**: Clique em "Exportar para Drive"
3. **Verifique**: Abra Google Drive e procure por `gastos.csv`
4. **Sincronize**: Use em outro dispositivo!

---

**Precisa de ajuda?** Veja o arquivo [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md) para instruções detalhadas.

**Encontrou um problema?** Verifique:
- ✅ Client ID está correto em `config.js`
- ✅ API Key está correto em `config.js`
- ✅ Google Drive API está habilitado no Console
- ✅ Você fez login com a conta Google
- ✅ Abra o console (F12) e procure por erros
