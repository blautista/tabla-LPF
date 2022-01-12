const cheerio = require("cheerio");
const express = require("express");
const axios = require("axios");

const hbs = require("express-handlebars");
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
app.use(express.static(__dirname + '/public'));

app.get("/", async (req, res) => {
  const data = await getSiteData();
  res.render("index", { tableData: data });
  console.log('rendered');
});

app.listen(3000, () => {
  console.log("listening...");
});

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
