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
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // 2. Tenta carregar de um arquivo local (para desenvolvimento no terminal)
    try {
      // Procura o arquivo na raiz do projeto, um nível acima da pasta 'functions'
      const serviceAccountPath = path.resolve(__dirname, "..", "serviceAccountKey.json");
      serviceAccount = require(serviceAccountPath);
      console.log("Chave de serviço carregada do arquivo local 'serviceAccountKey.json'.");
    } catch (e) {
      // Ignora o erro se o arquivo não existir, pois a variável de ambiente é a prioridade.
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.error("Chave de conta de serviço do Firebase não encontrada. Para rodar localmente, coloque o arquivo 'serviceAccountKey.json' na raiz do projeto. Para o GitHub Actions, configure o segredo FIREBASE_SERVICE_ACCOUNT_KEY.");
    process.exit(1); // Sai com código de erro
  }

  const db = admin.firestore();

  await runScraper(db).catch((error) => {
    console.error("A execução do scraper falhou:", error);
    process.exit(1);
  });
}

main();