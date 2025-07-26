const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {runScraper} = require("./src/scraper");

// Inicializa o Firebase Admin. As credenciais são gerenciadas automaticamente.
admin.initializeApp();

// Define a função para rodar na região de São Paulo e com um timeout maior.
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: "256MB",
};

/**
 * Uma Cloud Function agendada que executa o web scraper diariamente para
 * buscar novas oportunidades culturais e salvá-las no Firestore.
 */
exports.scrapeOpportunities = functions
    .region("southamerica-east1") // Região de São Paulo
    .runWith(runtimeOpts)
    .pubsub.schedule("every 24 hours") // Agenda para rodar uma vez por dia
    .onRun(async (_context) => {
      console.log("Iniciando o robô de busca de oportunidades (via Cloud Function)...");

      const db = admin.firestore();

      try {
        // Chama a lógica de scraping centralizada.
        await runScraper(db);
        return null;
      } catch (error) {
        // O erro já é logado dentro de runScraper.
        console.error("A execução da Cloud Function falhou.", error);
        return null;
      }
    });
