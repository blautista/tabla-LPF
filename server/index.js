const cheerio = require("cheerio");
const express = require("express");
const axios = require("axios");
const request = require("request");

const app = express();

//pos equipo pj g e p gf gc dg pts

const getSiteData = async () => {
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

app.get("/posiciones", async (req, res) => {
  const data = await getSiteData();
  console.log(data);
  // res.send(JSON.stringify(data));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(data));
});

app.listen(3000, () => {
  console.log("listening...");
});
