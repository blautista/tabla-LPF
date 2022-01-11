
getStuff = async() => {
  const res = await fetch('http://127.0.0.1:3000/posiciones');
  const json = await res.json();
  const data = json;
  return data;
}

const printTableData = (data) => {
  const table = document.getElementById('posiciones').querySelector('tbody');
  for (let i = 0; i < data.length; i++) {
    console.log(data);
    let tr = document.createElement('tr');
    table.appendChild(tr);
    for (let j = 0; j < data[i].length; j++) {
      let field = document.createElement('td');
      let text = document.createTextNode(data[i][j]);
      field.appendChild(text);
      tr.appendChild(field);
    }
  }
}

window.onload = async (evt) => {
  const data = await getStuff();
  printTableData(data);
}