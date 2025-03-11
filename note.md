git tag -> list all tag
git tag -a v1.1.0 -m 'add tag' -> Create a tag
git push origin v1.1.0 -> Send tag for repository

# Documentação da API Simplificada de Chat para N8N

## API Ultra Simplificada (Novo!)

```
POST /api/chat/simple
```

Esta é uma API simplificada para integração com N8N. Você só precisa enviar a mensagem e opcionalmente um ID de usuário:

### Requisição

```json
{
  "message": "Quero uma calcinha",
  "userId": "user123"
}
```

#### Parâmetros:
- `message`: A mensagem do usuário
- `userId` (opcional): Um identificador para manter o histórico. Se omitido, será gerado automaticamente.

### Resposta

```json
{
  "message": "Oi! Temos várias opções de calcinhas. Aqui estão algumas sugestões.",
  "products": [
    {
      "name": "Calcinha String",
      "price": "49.90",
      "image": "https://url-da-imagem.jpg",
      "url": "https://duhellen.com.br/produtos/calcinha-string"
    }
  ],
  "userId": "user123"
}
```

### Funcionamento
- O histórico da conversa é mantido automaticamente no servidor
- Não é necessário enviar mensagens anteriores
- Basta utilizar o mesmo `userId` para continuar a conversa

# Documentação da API Tradicional de Chat para Integração Externa

## Endpoint de Chat

```
POST /api/chat
```

Este endpoint pode ser usado para integrações externas (como N8N, Make, Zapier, etc) para comunicar com o assistente DUH.

### Parâmetros da Requisição

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Olá, estou procurando uma lingerie"
    }
  ],
  "conversationId": "user123-session456",
  "external": true
}
```

#### Parâmetros:

- `messages` (obrigatório): Array de mensagens no formato de chat. Cada mensagem deve ter:
  - `role`: "user" ou "assistant"
  - `content`: O texto da mensagem

- `conversationId` (opcional): Um identificador único para manter o contexto entre requisições. Se não for fornecido, um novo ID será gerado.

- `external` (obrigatório): Deve ser `true` para usar a API de integração.

### Resposta

A resposta será um objeto JSON no seguinte formato:

```json
{
  "message": "Olá! Como posso ajudar na sua busca por lingerie?",
  "products": [
    {
      "name": "Sutiã de Renda",
      "price": "79.90",
      "image": "https://url-da-imagem.jpg",
      "url": "https://duhellen.com.br/produtos/sutia-de-renda"
    }
  ],
  "conversation_id": "user123-session456",
  "assistant_message": {
    "role": "assistant",
    "content": "Olá! Como posso ajudar na sua busca por lingerie?"
  }
}
```

#### Campos da resposta:

- `message`: A mensagem de texto do assistente
- `products`: Array de produtos recomendados (se houver)
- `conversation_id`: ID da conversa para usar em requisições futuras
- `assistant_message`: Objeto formatado para facilitar a adição ao histórico

### Manutenção de Contexto (Histórico)

Para manter o histórico da conversa, é necessário enviar todas as mensagens anteriores em cada requisição. Isso pode ser feito da seguinte forma:

1. Na primeira requisição, envie apenas a mensagem do usuário

2. Na segunda requisição, inclua a mensagem anterior do usuário e a resposta do assistente, junto com a nova mensagem:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Olá, estou procurando uma lingerie"
    },
    {
      "role": "assistant",
      "content": "Olá! Como posso ajudar na sua busca por lingerie?"
    },
    {
      "role": "user",
      "content": "Quero um conjunto de calcinha e sutiã"
    }
  ],
  "conversationId": "user123-session456",
  "external": true
}
```

3. Continue este padrão para cada nova mensagem, mantendo todo o histórico.

### Exemplo de uso com N8N

1. Use um nó HTTP Request configurado como POST
2. Defina a URL como sua API: `https://seu-site.com/api/chat`
3. Configure o corpo da requisição conforme o exemplo acima
4. Nos nós subsequentes, concatene as mensagens anteriores com a nova resposta

```
// Exemplo de código para N8N (JavaScript)
const prevMessages = $input.item.json.prevMessages || [];
const newUserMessage = $input.item.json.userMessage;

// Preparar corpo da requisição
const body = {
  messages: [
    ...prevMessages,
    {
      role: "user",
      content: newUserMessage
    }
  ],
  conversationId: $input.item.json.conversationId,
  external: true
};

// Após receber a resposta
const response = $node.response;
const assistantMessage = response.assistant_message;

// Atualizar histórico para próxima iteração
const updatedMessages = [
  ...body.messages,
  assistantMessage
];

// Passar para o próximo nó
return {
  conversationId: response.conversation_id,
  prevMessages: updatedMessages,
  message: response.message,
  products: response.products
};
```