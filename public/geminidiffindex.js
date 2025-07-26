const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");

// Configuração da inicialização do Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) :
    null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.warn("Chave de conta de serviço do Firebase não encontrada. O robô não pode se conectar ao banco de dados. Certifique-se de que o segredo FIREBASE_SERVICE_ACCOUNT_KEY está configurado no GitHub Actions.");
  // Em um ambiente local sem a chave, podemos sair para evitar erros.
  if (!process.env.GITHUB_ACTIONS) {
    process.exit(0);
  }
}

async function scrapeOpportunities() {
  console.log("Iniciando o robô de busca de oportunidades...");

  const db = admin.firestore();
  const appId = "1:985486996681:web:2d6b4bdd470d0381120918";
  const opportunitiesRef = db.collection(`artifacts/${appId}/public/data/opportunities`);

  const url = "https://www.cultura.sp.gov.br/category/editais/";

  try {
    const {data} = await axios.get(url);
    const $ = cheerio.load(data);

    const promises = [];
    $("article.category-editais").each((index, element) => {
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
  }
}

// Executa a função principal
scrapeOpportunities();
