var pdf = require("pdf-creator-node");
var fs = require("fs");

// Read HTML Template
var html = fs.readFileSync("./template/index.html", "utf8");

var options = {
  format: "A3",
  orientation: "portrait",
  border: "10mm",
  header: {
    height: "10mm",
    contents: '<div style="text-align: center; font-size: 18px;">ALTERNATE FUTURES</div>'
  },
  footer: {
    height: "5mm",
    contents: {
      // first: 'Cover page',
      // 2: 'Second page', // Any page number is working. 1-based index
      default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
      // last: 'Last Page'
    }
  }
};

var users = [
  {
    name: "Shyam",
    age: "26",
  },
  {
    name: "Navjot",
    age: "26",
  },
  {
    name: "Vitthal",
    age: "26",
  },
];
var document = {
  html: html,
  data: {
    users: users,
    imgUrl: "./Rectangle 6.png",
    gpt1txt: "https://www.w3schools.com/html/pic_trulli.jpg",
    gpt2txt: "https://www.w3schools.com/html/pic_trulli.jpg",
    thumbImgUrl: "https://www.w3schools.com/html/pic_trulli.jpg"
  },
  path: "./output.pdf",
  type: "",
};

pdf
  .create(document, options)
  .then((res) => {
    console.log(res);
  })
  .catch((error) => {
    console.error(error);
  });