const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");

// Inicializa o Firebase Admin para que a função possa escrever no banco de dados.
admin.initializeApp();

// Define a função para rodar na região de São Paulo e com um timeout maior.
const runtimeOpts = {
  timeoutSeconds: 300,
  memory: "256MB",
};

exports.scrapeOpportunities = functions
    .region("southamerica-east1") // Região de São Paulo
    .runWith(runtimeOpts)
    .pubsub.schedule("every 24 hours") // Agenda para rodar uma vez por dia
    .onRun(async (context) => {
      console.log("Iniciando o robô de busca de oportunidades...");

      const db = admin.firestore();
      // IMPORTANTE: Este App ID deve ser o mesmo do seu frontend.
      const appId = "1:985486996681:web:2d6b4bdd470d0381120918";
      const opportunitiesRef = db.collection(`artifacts/${appId}/public/data/opportunities`);

      // --- Exemplo de Site para Buscar (Web Scraping) ---
      // Vamos usar um site de exemplo. No futuro, você pode adicionar mais.
      const url = "https://www.cultura.sp.gov.br/category/editais/"; // Exemplo real

      try {
        const {data} = await axios.get(url);
        const $ = cheerio.load(data);

        // O seletor abaixo depende da estrutura do site.
        // Este é um exemplo para o site da Cultura SP (pode precisar de ajuste).
        const promises = [];
        $("article.category-editais").each((index, element) => {
          const title = $(element).find("h2.entry-title a").text().trim();
          const sourceUrl = $(element).find("h2.entry-title a").attr("href");
          const description = $(element).find(".entry-content p").text().trim();

          if (title && sourceUrl) {
            console.log(`Oportunidade encontrada: ${title}`);
            // Cria um ID único para o documento para evitar duplicatas
            const docId = sourceUrl.split("/").filter(Boolean).pop();

            const newOpp = {
              title: title,
              description: description,
              sourceUrl: sourceUrl,
              category: "edital", // Categoria padrão para este scrape
              type: "edital",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              postedBy: "artmap-robot", // Identifica que foi postado pelo robô
            };
            // Usa set com merge:true para criar ou atualizar, evitando duplicatas.
            promises.push(opportunitiesRef.doc(docId).set(newOpp, {merge: true}));
          }
        });

        await Promise.all(promises);
        console.log("Busca concluída com sucesso!");
        return null;
      } catch (error) {
        console.error("Erro durante a busca (scraping):", error);
        return null;
      }
    });
