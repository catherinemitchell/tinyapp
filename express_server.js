const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const { getUserByEmail } = require('./helpers.js');
const app = express();
app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ["Ensure that no on can access passwords"],
})
);

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");


const PORT = 8080;



function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
};


function urlsForUser(id) {
  const result = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      result[shortURL] = urlDatabase[shortURL];
    }
  }
  return result;
};


//adding the ability to track what url is created by what user
const urlDatabase = {
  "b2xVn2": {
    userID: "aJ48lW",
    longURL: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    userID: "aJ48lW",
    longURL: "http://www.google.com"
  }
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
};



app.get("/", (req, res) => {
  res.redirect("/login");
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
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = {
    user,
    urls: urlDatabase
  };
  if (templateVars.user === undefined) {
    return res.status(403).send('Please login or register to view urls');
  }
  const urls = urlsForUser(userID);
  templateVars.urls = urls;
  console.log(templateVars, userID);
  res.render("urls_index", templateVars);
});



app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user === undefined) {
    return res.status(403).send('You must be logged in to shorten urls');
  }

  const id = generateRandomString();
  urlDatabase[id] = {
    userID,
    shortURL: id,
    longURL: req.body.longURL
  };

  res.redirect(`/urls/${id}`);
});


// this will get new form.
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user === undefined) {
    return res.redirect("/login");
  }
  res.render('urls_new', templateVars);
});


app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.status(403).send('You must be logged in to view URL pages');
  }
  const user = users[user_id];

  if (!user) {
    return res.status(403).send('Invalid session!  Please login to continue');
  }
  const { id } = req.params;
  const urlObj = urlDatabase[id];

  if (!urlObj) {
    return res.status(403).send('The short URL does not exist');
  }

  if (urlObj.userID !== user_id) {
    return res.status(403).send('You are not authorized to view');
  }

  const templateVars = {
    shortUrl: id,
    longURL: urlDatabase[id].longURL,
    user,
  };

  res.render("urls_show", templateVars);
});



app.post("/urls/:id/", (req, res) => {
  const id = req.params.id;
  const longUrl = req.body.longUrl;

  if (!urlDatabase[id]) {
    return res.status(404).send('id does not exist');
  }

  if (!req.session.user_id) {
    return res.status(403).send('user not logged in');
  }

  if (req.session.user_id !== urlDatabase[id].userID) {
    return res.status(403).send('user does not own the URL');
  }

  const templateVars = {
    user: users[req.session.user_id]
  };

  urlDatabase[id].longURL = longUrl;
  urlDatabase[id].userID = templateVars.user.id;

  res.redirect("/urls");
});



app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL === undefined) {
    return res.status(404).send('Url not found');
  }
  res.redirect(longURL);
});



app.post("/urls/:id/delete", (req, res) => {

  const id = req.params.id;
  const longUrl = req.body.longUrl;

  if (!urlDatabase[id]) {
    return res.status(404).send('id does not exist');
  }

  if (!req.session.user_id) {
    return res.status(403).send('user not logged in');
  }

  if (urlDatabase[id].userID !== req.session.user_id) {
    return res.status(403).send('You are not authorized to delete this URL');
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});


app.get("/login", (req, res) => {
  // looks in the cookies and checks if there is a cookie named user_id
  //if there is, it puts it in userID, if not it's underfined
  // if userID is not undefined then it redirects to /urls
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  }
  const user = users[userID];
  res.render('urls_login', { user });
});



app.post("/login", (req, res) => {

  const user = getUserByEmail(req.body.email, users);
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  bcrypt.compareSync("password", hashedPassword);

  if (!user) {
    res.status(403).send('That user does not exist!');
    return;
  } else if (user.password !== req.body.password) {
    res.status(403).send('Invalid credentials!');
    return;
  }
  req.session.user_id = user.id;
  res.redirect('/urls');
});



app.post("/logout", (req, res) => {
  req.session = null;

  res.redirect("/login");
});



app.get("/register", (req, res) => {

  const userID = req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  }

  const user = users[userID];
  res.render('urls_registration', { user });
});



app.post("/register", (req, res) => {

  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send('Invalide credentials');
    return;
  }
  const user = getUserByEmail(email, users);
  console.log(user);

  if (user) {
    res.status(400).send('That user already exists!');
    return;
  }

  users[id] = {
    id: id,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };

  req.session.user_id = id;

  console.log(users[id]);
  res.redirect("/urls");

});

