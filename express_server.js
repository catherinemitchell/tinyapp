const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());

const PORT = 8080;

app.set("view engine", "ejs");

function generateRandomString() {
  return Math.random().toString(36).substring(2,8)

}
console.log(generateRandomString())

function getUserByEmail(email) {
  for (let user in users) {
    if (users[user].email === email) {
    return users[user];
    }
  } 
  return null
}


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "abc"
  }
}

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
  const userID = req.cookies["user_id"]
  const user = users[userID]
  const templateVars = { 
    user,
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

// this will get new form.
app.get("/urls/new", (req, res) => {  
  const templateVars = {
    user: users[req.cookies["user_id"]]
  } 
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const {id} = req.params
  const templateVars = { 
    shortUrl: id, 
    longURL: urlDatabase[id],
    user: users[req.cookies["user_id"]]  
  };
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

app.get("/login", (req, res) => {
  
  const userID = req.cookies['user_id'];
  if (userID) {
    return res.redirect("/urls")
  } 
  
  const user = users[userID]
  res.render('urls_login', { user })
})

app.post("/login", (req, res) => {

  const user = getUserByEmail(req.body.email);
  // console.log(user, user.password, req.body.password)
  if (!user) {
    res.status(403).send('That user does not exist!');
    return;
  } else if (user.password !== req.body.password) {
    res.status(403).send('Invalid credentials!');
    return
  } 
    res.cookie('user_id', user.id).redirect('/urls')
  })
// app.post("/login", (req, res) => {
//   const user = getUserByEmail(req.body.email)
  
//   res.cookie('user_id', user.id).redirect('/urls');
// })

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");

  res.redirect("/login");
})

app.get("/register", (req, res) => {
  
  const userID = req.cookies['user_id'];
  if (userID) {
    return res.redirect("/urls")
  } 
  
  const user = users[userID]
  res.render('urls_registration', { user })
})

app.post("/register", (req, res) => {

  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send('Invalide credentials');
    return
  }
  const user = getUserByEmail(email);
console.log(user)

  if (user) {
    res.status(400).send('That user already exists!');
    return;
  }

 

  users[id] = {
    id: id,
    email: email,
    password: password
  }

  res.cookie('user_id', id);

  console.log(users[id])
  res.redirect("/urls");

})

