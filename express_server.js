/* eslint-disable camelcase */
const cookieSession = require("cookie-session");
const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");

// Importing Helper Function from helpers.js file, and empty database objects from database.js
const { getUserByEmail, generateRandomString, urlsForUser, includesUniqueView } = require("./helpers");
const { urlDatabase, users } = require("./database");


// Middleware

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieSession({
  name: "session",
  keys: ["key0"],
}));
app.use(methodOverride("_method"));

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
  const id = req.params.id;
  const userId = req.session.user_id;
  const userUrls = urlsForUser(userId, urlDatabase);
  if (!userId) {
    const templateVars = {user: users[userId], errorMessage: "Please log in to edit this URL"};
    res.render("error", templateVars);
  } else if (urlDatabase[id].userId !== userId) {
    const templateVars = {user: users[userId], errorMessage: "You do not own this URL"};
    res.status(401);
    res.render("error", templateVars);
  } else {
    const templateVars = {
      id: id,
      longURL: userUrls[id].longURL,
      user: users[userId],
      views: urlDatabase[id]["views"].length,
      uniqueViews: urlDatabase[id]["uniqueViews"].length,
      viewsArr: urlDatabase[id]["views"],
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const userId = req.session.user_id;
  let date = new Date();
  let readableDate = date.toUTCString();
  if (!urlDatabase[req.params.id]) {
    const templateVars = {user: users[userId], errorMessage: "URL Not in Database",};
    res.render("error", templateVars);
  } else {
    let uniqueId; // Assigning a unique ID to every visitor depending if they're logged in or a visitor
    if (userId) {
      uniqueId = userId;
    } else {
      if (!req.session.visitor_id) {
        let visitorID = generateRandomString();
        req.session.visitor_id = visitorID;
        uniqueId = visitorID;
      } else {
        uniqueId = req.session.visitor_id;
      }
    }
    if (!includesUniqueView(uniqueId, urlDatabase[id]["uniqueViews"])) {
      urlDatabase[id]["uniqueViews"].push({uniqueId, readableDate}); // Adding a visit log to unique views array if the array does not include the current user
    }
    urlDatabase[id]["views"].push({uniqueId, readableDate}); // Adding a visit log regardless if they are unique or not
    res.redirect(urlDatabase[id].longURL);
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
    urlDatabase[newID]["views"] = [],
    urlDatabase[newID]["uniqueViews"] = [],
    res.redirect(`/urls/${newID}`);
  }
});

app.put("/urls/:id", (req, res) => {
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

app.delete("/urls/:id", (req, res) => {
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