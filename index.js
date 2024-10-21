/**
 * A sample Express server with static resources.
 */
"use strict";

const bodyParser = require("body-parser");

const port    = 3000;
const path    = require("path");
const express = require("express");
const app     = express();
const middleware = require("./middleware/index.js");
const route = require("./routes/routes.js");
const config = require("./config/config.json")
const session = require('express-session');

require('./services/mailer.js');

app.set("view engine", "ejs");
app.use(session({
    secret: '$1LP;d/#p3Mkk#IjbK`LN3[]FbT9hP',  // Use a strong secret key in production
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { 
        maxAge: 30 * 60 * 1000,
        httpOnly: true,
        secure: false }
}));
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});
app.use(middleware.logIncomingToConsole);
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("", route);
app.listen(port, '0.0.0.0', logStartUpDetailsToConsole);

function logStartUpDetailsToConsole() {
    let routes = [];

    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push(middleware.route);
        } else if (middleware.name === "router") {
            middleware.handle.stack.forEach((handler) => {
                let route;
                route = handler.route;
                route && routes.push(route);
            });
        }
    });

    console.info(`Server is listening on port ${port}.`);
    console.info("Available routes are:");
    console.info(routes);
}