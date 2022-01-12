const cheerio = require("cheerio");
const schedule = require("node-schedule");
const express = require("express");
const axios = require("axios");
const hbs = require("express-handlebars");

const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();

app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layouts",
  })
);

app.set("views", __dirname + "/views");
app.set("view engine", "hbs");

app.use(express.static(__dirname + "/public"));

app.get("/", async (req, res) => {
  try {
    
    const data = await getLatestDatabaseData();
    const standings = data.standings;
    res.render("index", {
      tableData: standings,
      fetchingInterval: process.env.FETCHING_INTERVAL,
    });
  } catch (error) {
    res.render("error", { message: error });
  }
});

app.listen(process.env.PORT, () => {
  console.log("listening...");
});

const scrapingJob = schedule.scheduleJob(
  //funcion recurrente cada FETCHING_INTERVAL minutos
  `*/${process.env.FETCHING_INTERVAL} * * * *`,
  async () => {
    console.log("Trying to scrape....");
    try {
      const res = await saveSiteDataOnDatabase();
      console.log("Successfully fetched data");
    } catch (error) {
      console.log("There was an error scraping the data: " + error);
    }
  }
);

const getLatestDatabaseData = async () => {
  //obtiene informacion de la db
  const client = await MongoClient.connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.gpmz6.mongodb.net/standings?retryWrites=true&w=majority`
  );
  const db = client.db();
  const standingsCollection = db.collection("standings");
  const data = await standingsCollection
    .find()
    .limit(1)
    .sort({ $natural: -1 })
    .toArray();
  client.close();
  return data[0];
};

const saveSiteDataOnDatabase = async () => {
  //guarda la informacion obtenida del scraping en la db
  try {
    const data = await scrapeSiteData();
    const client = await MongoClient.connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.gpmz6.mongodb.net/standings?retryWrites=true&w=majority`
    );
    const db = client.db();
    const standingsCollection = db.collection("standings");
    const res = await standingsCollection.insertOne({ standings: data });
    client.close();
    console.log("Data saved succesfully");
    return 1;
  } catch (error) {
    console.log(error);
    return 0;
  }
};

const scrapeSiteData = async () => {
  //retorna la informacion de la tabla externa
  try {
    const res = await axios.get(
      "https://www.futbolargentino.com/primera-division/tabla-de-posiciones"
    );

    let dataArray = [];

    const $ = cheerio.load(res.data);
    const table = $("tbody");

    table.children("tr").each((itr, tr) => {
      //loopea por cada fila de la tabla
      let rowObject = {};
      rowObject.POS = $(tr).children("td").eq(0).text().replace(/\s\s+/g, "");
      rowObject.IMG = $(tr)
        .children("td")
        .eq(1)
        .children("a")
        .eq(0)
        .children("img")
        .eq(0)
        .attr("data-src");
      rowObject.NOMBRE = $(tr)
        .children("td")
        .eq(1)
        .children("a")
        .children("span")
        .eq(0)
        .text()
        .replace(/\s\s+/g, "");
      rowObject.PJ = $(tr).children("td").eq(2).text().replace(/\s\s+/g, "");
      rowObject.G = $(tr).children("td").eq(3).text().replace(/\s\s+/g, "");
      rowObject.E = $(tr).children("td").eq(4).text().replace(/\s\s+/g, "");
      rowObject.P = $(tr).children("td").eq(5).text().replace(/\s\s+/g, "");
      rowObject.GF = $(tr).children("td").eq(6).text().replace(/\s\s+/g, "");
      rowObject.GC = $(tr).children("td").eq(7).text().replace(/\s\s+/g, "");
      rowObject.DG = $(tr).children("td").eq(8).text().replace(/\s\s+/g, "");
      rowObject.PTS = $(tr).children("td").eq(9).text().replace(/\s\s+/g, "");
      dataArray.push({ ...rowObject });
    });
    return dataArray;
  } catch (error) {
    console.log(error);
    return error;
  }
};
