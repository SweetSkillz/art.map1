const axios = require("axios");
const cheerio = require("cheerio");
const admin = require("firebase-admin");

/**
 * Realiza o web scraping de oportunidades e as salva no Firestore.
 * @param {FirebaseFirestore.Firestore} db A instância do Firestore.
 */
async function runScraper(db) {
  // IMPORTANTE: Este App ID deve ser o mesmo do seu frontend.
  const appId = "1:985486996681:web:2d6b4bdd470d0381120918";
  const opportunitiesRef = db.collection(`artifacts/${appId}/public/data/opportunities`);

  const url = "https://www.cultura.sp.gov.br/category/editais/";

  try {
    const {data} = await axios.get(url);
    const $ = cheerio.load(data);

    const promises = [];
    $("article.category-editais").each((_index, element) => {
      const title = $(element).find("h2.entry-title a").text().trim();
      const sourceUrl = $(element).find("h2.entry-title a").attr("href");
      const description = $(element).find(".entry-content p").text().trim();

      if (title && sourceUrl) {
        console.log(`Oportunidade encontrada: ${title}`);
        const docId = sourceUrl.split("/").filter(Boolean).pop();

        const newOpp = {
          title: title,
          description: description,
          sourceUrl: sourceUrl,
          category: "edital",
          type: "edital",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          postedBy: "artmap-robot",
        };
        promises.push(opportunitiesRef.doc(docId).set(newOpp, {merge: true}));
      }
    });

    await Promise.all(promises);
    console.log("Busca concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a busca (scraping):", error);
    // Lançar o erro para que o chamador (Cloud Function ou script) saiba que falhou.
    throw error;
  }
}

module.exports = {runScraper};