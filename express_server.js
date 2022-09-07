const cookieSession = require("cookie-session");
const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const getUserByEmail = require("./helpers");


// Middleware
app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieSession({
  name: "session",
  keys: ["key0"],
}));

// Empty Objects to be filled with users registration and URL generation

const urlDatabase = {
};

const users = {
};

// Helper Functions

// Generates a random string to be used as our user IDs
const generateRandomString = () => {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Returns a URL database that includes ONLY the URLs associated with the logged in user
const urlsForUser = (userId) => {
  let output = {};
  for (let url of Object.keys(urlDatabase)) {
    if (urlDatabase[url].userId === userId) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
};

// Get Requests

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send("Please log in to view your URLS");
  } else {
    const templateVars = {
      urls: urlsForUser(req.session.user_id),
      user: users[req.session.user_id],
    };
    res.render("urls_index", templateVars);
  }
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
  const userUrls = urlsForUser(req.session.user_id);
  if (!req.session.user_id) {
    res.redirect("/login");
  } else if (urlDatabase[req.params.id].userId !== req.session.user_id) {
    res.send("You do not own this URL");
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
    res.send("URL Not in Database");
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

/// Post Requests

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send("Not logged in.\nPlease log in to shorten URLs.");
  } else {
    let newID = generateRandomString();
    urlDatabase[newID] = {};
    urlDatabase[newID]["longURL"] = req.body.longURL;
    urlDatabase[newID]["userId"] = req.session.user_id;
    console.log(urlDatabase);
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
    res.status(403);
    res.send("Email not found");
  } else if (!bcrypt.compareSync(password, userObj.password)) {
    res.status(403);
    res.send("Incorrect Password");
  } else {
    let userId = userObj.id;
    req.session.user_id = userId;
    console.log(users);
    console.log(req.session.user_id);
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
    res.status(400);
    res.send("Not a valid email or password");
  } else if (getUserByEmail(email, users) !== null) {
    res.status(400);
    res.send(`Email already taken`);
  } else {
    let randomId = generateRandomString();
    users[randomId] = {
      id: randomId,
      email,
      password: hashedPassword,
    };
    console.log(users);
    req.session.user_id = users[randomId].id;
    res.redirect("/urls");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});