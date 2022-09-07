const cookieSession = require("cookie-session");
const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
// Importing Helper Function from helpers.js file
const { getUserByEmail, generateRandomString, urlsForUser } = require("./helpers");

// Middleware
app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieSession({
  name: "session",
  keys: ["key0"],
}));

// Empty Objects to be filled with users registration and URL generation

const urlDatabase = {};

const users = {};

// Get Requests

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user: users[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[req.session.user_id]};
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id, urlDatabase);
  if (!req.session.user_id) {
    res.redirect("/login");
  } else if (urlDatabase[req.params.id].userId !== req.session.user_id) {
    const templateVars = {user: users[req.session.user_id], errorMessage: "You do not own this URL"};
    res.status(401);
    res.render("error", templateVars);
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: userUrls[req.params.id].longURL,
      user: users[req.session.user_id],
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    const templateVars = {user: users[req.session.user_id], errorMessage: "URL Not in Database",};
    res.render("error", templateVars);
  } else {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id]};
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("registration", templateVars);
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[req.session.user_id]};
    res.render("login", templateVars);
  }
});

app.get("*", (req,res) => {
  const templateVars = { user: users[req.session.user_id], errorMessage: "Page Not Found"};
  res.status(404);
  res.render("error", templateVars);
});

/// Post Requests

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    // This redirects to /urls because url_index has a condition that will tell the user to log in to see URLs
    res.redirect("/urls");
  } else {
    let newID = generateRandomString();
    urlDatabase[newID] = {};
    urlDatabase[newID]["longURL"] = req.body.longURL;
    urlDatabase[newID]["userId"] = req.session.user_id;
    res.redirect(`/urls/${newID}`);
  }
});

app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  if (!req.session.user_id) {
    res.send("Not logged in.\nPlease log in to shorten URLs.");
  } else if (!urlDatabase[id]) {
    res.send("ID does not exist");
  } else if (urlDatabase[id].userId !== req.session.user_id) {
    res.send("You do not own this URL");
  } else {
    urlDatabase[id].longURL = req.body.newLongURL;
    res.redirect(`/urls`);
  }
});


app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  if (!req.session.user_id) {
    res.send("Not logged in.\nPlease log in to delete URLs.");
  } else if (!urlDatabase[id]) {
    res.send("ID does not exist");
  } else if (urlDatabase[id].userId !== req.session.user_id) {
    res.send("You do not own this URL");
  } else {
    let id = req.params.id;
    delete urlDatabase[id];
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userObj = getUserByEmail(email, users);
  if (!userObj) {
    const templateVars = { user: users[req.session.user_id], errorMessage: "Email Not Found"};
    res.status(403);
    res.render("error", templateVars);
  } else if (!bcrypt.compareSync(password, userObj.password)) {
    const templateVars = { user: users[req.session.user_id], errorMessage: "Incorrect Password"};
    res.status(403);
    res.render("error", templateVars);
  } else {
    let userId = userObj.id;
    req.session.user_id = userId;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "" || password === "") {
    const templateVars = { user: users[req.session.user_id], errorMessage: "Email or Password not valid"};
    res.status(400);
    res.render("error", templateVars);
  } else if (getUserByEmail(email, users) !== null) {
    const templateVars = { user: users[req.session.user_id], errorMessage: "Email already in use"};
    res.status(400);
    res.render(`error`, templateVars);
  } else {
    let randomId = generateRandomString();
    users[randomId] = {
      id: randomId,
      email,
      password: hashedPassword,
    };
    req.session.user_id = users[randomId].id;
    res.redirect("/urls");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});