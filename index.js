const cheerio = require('cheerio')
const express = require('express')
const request = require('request')

const app = express();

const getSiteData = () => {
  try {
    request("https://www.futbolargentino.com/primera-division/tabla-de-posiciones", (err, res, body) => {
      const $ = cheerio.load(body);

      const table = $('tbody');
      table.children('tr').each((itr, tr) => {
        $(tr).children().each((itd, td) => {
          console.log($(td).text().replace(/\s\s+/g, ''));
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
  
  
}

getSiteData();