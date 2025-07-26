const admin = require("firebase-admin");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const {runScraper} = require("./src/scraper");

// Inicializa o Firebase Admin. As credenciais são gerenciadas automaticamente.
admin.initializeApp();

/**
 * Uma Cloud Function agendada que executa o web scraper diariamente para
 * buscar novas oportunidades culturais e salvá-las no Firestore.
 */
exports.scrapeOpportunities = onSchedule({
  schedule: "every 24 hours",
  region: "southamerica-east1",
  timeoutSeconds: 300,
  memory: "256MB",
}, async (_event) => {
  logger.info("Iniciando o robô de busca de oportunidades (via Cloud Function)...");

  const db = admin.firestore();

  try {
    // Chama a lógica de scraping centralizada.
    await runScraper(db, logger);
    logger.info("Cloud Function executada com sucesso.");
    return null;
  } catch (error) {
    // O erro já é logado dentro de runScraper.
    logger.error("A execução da Cloud Function falhou.", error);
    return null;
  }
});
