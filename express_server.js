const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

function generateRandomString() {
  return Math.random().toString(36).substring(2,8)

}
console.log(generateRandomString())
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World<b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// this will get new form.
app.get("/urls/new", (req, res) => {   
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const {id} = req.params
  const templateVars = { shortUrl: id, longURL: urlDatabase[id]};
  res.render("urls_show", templateVars);
})

app.post("/urls", (req, res) => {
  const id = generateRandomString()
  urlDatabase[id] = req.body.longURL
  console.log(urlDatabase); 
  res.redirect(`/urls/${id}`)
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const {id} = req.params
  delete urlDatabase[id]
  res.redirect("/urls")
})

app.post("/urls/:id/", (req, res) => {
  const id = req.params.id
  const longUrl = req.body.longUrl
   urlDatabase[id] = longUrl
  res.redirect("/urls")
})

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username).redirect('/urls');
})