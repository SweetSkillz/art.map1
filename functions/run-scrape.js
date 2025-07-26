const admin = require("firebase-admin");
const {runScraper} = require("./src/scraper");
const path = require("path");

/**
 * Este script é o ponto de entrada para executar o scraper a partir de um
 * ambiente externo, como o GitHub Actions. Ele lida com a inicialização
 * do Firebase Admin usando uma chave de serviço.
 */

async function main() {
  console.log("Iniciando o robô de busca de oportunidades (via script)...");

  let serviceAccount;

  // 1. Tenta carregar da variável de ambiente (para o GitHub Actions)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.error("Erro ao analisar a chave de serviço do Firebase da variável de ambiente. Verifique se o segredo FIREBASE_SERVICE_ACCOUNT_KEY é um JSON válido.", e);
      process.exit(1);
    }
  } else {
    // 2. Tenta carregar de um arquivo local (para desenvolvimento no terminal)
    try {
      // Procura o arquivo na raiz do projeto, um nível acima da pasta 'functions'
      const serviceAccountPath = path.resolve(__dirname, "..", "serviceAccountKey.json");
      serviceAccount = require(serviceAccountPath);
      console.log("Chave de serviço carregada do arquivo local 'serviceAccountKey.json'.");
    } catch (e) {
      // Se o erro não for "módulo não encontrado", significa que o arquivo existe mas é inválido.
      // É importante mostrar esse erro para facilitar a depuração.
      if (e.code !== "MODULE_NOT_FOUND") {
        console.error("Erro ao carregar o arquivo 'serviceAccountKey.json'. Verifique se o JSON é válido.", e);
      }
      // Se o erro for 'MODULE_NOT_FOUND', o comportamento está correto: ignoramos e seguimos em frente.
    }
  }

  if (!serviceAccount) {
    console.error("Chave de conta de serviço do Firebase não encontrada. Para rodar localmente, coloque o arquivo 'serviceAccountKey.json' na raiz do projeto. Para o GitHub Actions, configure o segredo FIREBASE_SERVICE_ACCOUNT_KEY.");
    process.exit(1); // Sai com código de erro
  }

  // Inicializa o app do Firebase apenas se ainda não houver um app inicializado.
  // Isso torna o script mais seguro caso seja importado por outro módulo.
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();

  await runScraper(db).catch((error) => {
    console.error("A execução do scraper falhou:", error);
    process.exit(1);
  });
}

main();