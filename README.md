# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["screenshot description"](#)
!["screenshot description"](#)

## Dependencies

- Node.js
- Express
- EJS
- bcryptjs
- cookie-session
- method-override
- morgan

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` or `npm start` command.

## Features

- Passwords used in TinyApp will be encrypted using bcrypytjs.
- Each TinyURL page has a visit log that shows the total number of visits AND unique visists to the TinyURL.
  - The log also shows the visitor ID and the date that they visited the TinyURL.