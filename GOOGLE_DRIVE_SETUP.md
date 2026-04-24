# Integração com Google Drive - Guia de Configuração

## Como Configurar a Integração com Google Drive

### Passo 1: Criar um Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique em **"Criar Projeto"** (ou selecione um projeto existente)
3. Digite um nome para o projeto, ex: "Controle de Gastos"
4. Clique em **"Criar"**

### Passo 2: Habilitar a Google Drive API

1. No Cloud Console, vá para **"APIs e Serviços"** → **"Biblioteca"**
2. Procure por **"Google Drive API"**
3. Clique em **"Google Drive API"**
4. Clique em **"ATIVAR"**

### Passo 3: Criar as Credenciais de OAuth 2.0

1. Vá para **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"+ CRIAR CREDENCIAIS"** → **"ID do cliente OAuth"**
3. Se solicitado, configure a **"tela de consentimento OAuth"** primeiro:
   - Escolha **"Externo"** como tipo de usuário
   - Preencha as informações necessárias
   - Adicione escopos: `https://www.googleapis.com/auth/drive.file`
4. Tipo de aplicação: **"Aplicativo da Web"**
5. Em **"URIs autorizados de origem JavaScript"**, adicione:
   ```
   http://localhost:3000
   file://
   ```
6. Em **"URIs autorizados de redirecionamento"**, adicione:
   ```
   http://localhost
   file://localhost
   ```
7. Clique em **"Criar"**
8. Copie o **ID do Cliente**

### Passo 4: Obter a Chave de API

1. Clique em **"+ CRIAR CREDENCIAIS"** → **"Chave de API"**
2. Copie a chave de API exibida

### Passo 5: Configurar no Projeto

1. Abra o arquivo `config.js`
2. Substitua `YOUR_CLIENT_ID` pelo ID do Cliente que copiou
3. Substitua `YOUR_API_KEY` pela Chave de API que copiou

Exemplo:
```javascript
const GOOGLE_CONFIG = {
  clientId: '123456789-abcdefgh.apps.googleusercontent.com',
  apiKey: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxx',
  ...
};
```

### Passo 6: Testar a Integração

1. Abra o arquivo `controle-de-gastos.html` no navegador
2. Clique no botão **"Google"** na barra superior
3. Faça login com sua conta Google
4. Use os botões **"Importar do Drive"** e **"Exportar para Drive"**

## Recursos da Integração

- ✅ **Importar CSV do Google Drive**: Carrega seus gastos salvos do Drive
- ✅ **Exportar para Google Drive**: Salva seus gastos no Drive
- ✅ **Sincronização**: Sincronize automaticamente entre dispositivos
- ✅ **Backup**: Seus dados estão seguros na nuvem

## Notas Importantes

- O arquivo é nomeado como `gastos.csv` no Google Drive
- Os dados locais também são mantidos no localStorage
- Você pode usar tanto importação local quanto do Google Drive
- A integração é segura e usa OAuth 2.0

## Solução de Problemas

Se encontrar erros:
1. Verifique se as credenciais estão corretas em `config.js`
2. Certifique-se de que o Google Drive API está habilitado
3. Verifique o console do navegador (F12) para mensagens de erro
4. Limpe o cache do navegador e tente novamente

## Desenvolvidor

Para mais informações sobre Google Drive API, consulte:
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
