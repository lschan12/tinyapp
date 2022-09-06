const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = 8080;
const cookieParser = require("cookie-parser");
const e = require("express");

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
};

const findUser = (newEmail) => {
  for (let userId in users) {
    if (users[userId].email === newEmail) {
      return users[userId];
    }
  }
  return null;
};

const generateRandomString = () => {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Get Requests

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id],};
  console.log(users);
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.user_id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  res.render("registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  res.render("login", templateVars);
});

/// Post Requests

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`); // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.newLongURL;
  res.redirect(`/urls`);
});


app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userObj = findUser(email);
  if (!userObj) {
    res.status(403);
    res.send("Email not found");
  } else if (userObj.password !== password) {
    res.status(403);
    res.send("Incorrect Password");
  } else {
    let userId = userObj.id;
    res.cookie("user_id", userId);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400);
    res.send("Not a valid email or password");
  } else if (findUser(email) !== null) {
    res.status(400);
    res.send(`Email already taken`);
  } else {
    let randomId = generateRandomString();
    users[randomId] = {
      id: randomId,
      email,
      password,
    };
    console.log(users);
    res.cookie("user_id", users[randomId].id);
    res.redirect("/urls");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});