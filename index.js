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
//pos equipo pj g e p gf gc dg pts
app.use(express.static(__dirname + "/public"));

app.get("/", async (req, res) => {
  const data = await getLatestDatabaseData();
  const standings = data.standings;
  console.log(data);
  res.render("index", { tableData: standings });
  console.log("rendered");
});

app.listen(process.env.PORT, () => {
  console.log("listening...");
});

const scrapingJob = schedule.scheduleJob(`*/${process.env.FETCHING_INTERVAL} * * * *`, async () => {
  console.log("Trying to scrape....");
  try {
    const res = await saveSiteDataOnDatabase();
    console.log("Successfully fetched data");
  } catch (error) {
    console.log(error);
  }
});

const getLatestDatabaseData = async () => {
  const client = await MongoClient.connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.gpmz6.mongodb.net/standings?retryWrites=true&w=majority`
  );
  const db = client.db();
  const standingsCollection = db.collection("standings");
  const data = await standingsCollection.find().limit(1).sort({ $natural: -1 }).toArray();
  console.log(data[0]);
  client.close();
  return data[0];
};

const saveSiteDataOnDatabase = async () => {
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
  try {
    const res = await axios.get(
      "https://www.futbolargentino.com/primera-division/tabla-de-posiciones"
    );
    let dataArray = [];
    const $ = cheerio.load(res.data);

    const table = $("tbody");
    table.children("tr").each((itr, tr) => {
      let rowArray = [];
      $(tr)
        .children()
        .each((itd, td) => {
          rowArray.push($(td).text().replace(/\s\s+/g, ""));
          // console.log($(td).text().replace(/\s\s+/g, ''));
        });
      dataArray.push(rowArray);
    });

    return dataArray;
  } catch (error) {
    console.log(error);
    return error;
  }
};
