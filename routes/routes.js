/**
 * Route for bank.
 */
"use strict";

const express = require("express");
const router  = express.Router();
const funcs    = require("../src/functions.js");
const { isAuthenticated, ensureAgentOrAdmin, ensureUser, ticketAccess } = require("../middleware/authMiddleware");
const config = require("../config/config.json")
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const multer = require("multer");
const path = require("path");
const axios = require("axios");

router.use(passport.initialize());
router.use(passport.session());

passport.use(new Auth0Strategy({
    domain: config.Auth0.CLIENT_DOMAIN,
    clientID: config.Auth0.CLIENT_ID,
    clientSecret: config.Auth0.CLIENT_SECRET,
    callbackURL: config.Auth0.CALLBACK_URL,
  }, (accessToken, refreshToken, extraParams, profile, done) => {
    profile.accessToken = accessToken;
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Uploads is the Upload_folder_name
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

// Define the maximum size for uploading
// picture i.e. 1 MB. it is optional
const maxSize = 1 * 1000 * 1000;

var upload = multer({
    storage: storage,
    limits: { fileSize: maxSize, files: 10 },
    fileFilter: function (req, file, cb) {
        // Set the filetypes, it is optional
        var filetypes = /jpeg|jpg|png|pdf/;
        var mimetype = filetypes.test(file.mimetype);

        var extname = filetypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        if (mimetype && extname) {
            return cb(null, true);
        }

        cb(
            "Error: File upload only supports the " +
                "following filetypes - " +
                filetypes
        );
    },

    // mypic is the name of file attribute
}).array("uploads", 10);

router.get('/login', passport.authenticate('auth0', {
    scope: 'openid email profile'
  }), (req, res) => {
    res.redirect('/');
});
  
router.get('/callback', passport.authenticate('auth0', {
    failureRedirect: '/failure'
  }), (req, res) => {
    const userRoles = req.user._json['https://ticketsystem.com/roles'] || [];

    req.session.roles = userRoles;
    req.session.accessToken = req.user.accessToken;

    res.redirect('/dashboard');
});
  
router.get('/failure', (req, res) => {
    res.render('error', { message: 'Authentication failed. Please try again.' });
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.redirect(`https://${config.Auth0.CLIENT_DOMAIN}/v2/logout?returnTo=${config.Auth0.LOGOUT_URL}&client_id=${config.Auth0.CLIENT_ID}`);
        });
    });
});

router.post("/uploadFiles", upload, async function (req, res, next) {
    const ticket_id = req.body.ticket_id;
    const file_names = req.files.map(file => file.filename);
    for (const name of file_names) {
        await funcs.uploadFiles(name, ticket_id);
    }
});

router.get("/dashboard", isAuthenticated, async (req, res) => {
    const user = req.user;

    let data = {
        title: "Dashboard",
        user,
        role: req.session.roles[0],
        categories: await funcs.getCategories()
    };

    if(req.session.roles.includes("User")){
        data.tickets = await funcs.getTicketsByUserId(data.user.id);
    } else{
        data.tickets = await funcs.getTickets();
    }
    res.render("dashboard", data);
});

router.post("/dashboard/firstLogin", isAuthenticated, async (req, res) => {
    const { name, password } = req.body;
    await funcs.updateUserOnFirstLogin(req.user.id, name, password);
    req.user.displayName = name;
    req.session.save((err) => {
        if (err) {
            console.error("Error saving session:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect(`/dashboard`);
    });
});

router.post("/dashboard/createTicket", isAuthenticated, upload, async (req, res) => {
    const { title, user_id, user_name, user_email, category, description } = req.body;
    const ticket_id = await funcs.createTicket(title, user_id, user_email, user_name, category, description);

    if (req.files && req.files.length > 0) {
        await funcs.uploadFiles(req.files, ticket_id[0].id);
    }

    res.redirect("/dashboard");
});

router.post("/dashboard/createCategory", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const category_name = req.body.category_name;
    await funcs.createCategory(category_name);
    res.redirect("/dashboard");
});

router.get("/dashboard/:id", isAuthenticated, ticketAccess, async (req, res) => {
    const user = req.user;
    const id = parseInt(req.params.id);
    let agents = req.session.agents;

    if (!agents) {
        const options = {
            method: 'GET',
            url: `https://${config.Auth0.CLIENT_DOMAIN}/api/v2/roles/rol_O69N7QGMEMtlMDhZ/users`,
            headers: { 
                'content-type': 'application/json',
                'Authorization': `Bearer ${await funcs.getAccessToken()}`
            }
        };
        const response = await axios(options);
        agents = response.data;
        req.session.agents = agents;
    }

    let ticket = await funcs.getTicketByTicketId(id);

    let data = {
        title: "Ticket Details",
        user,
        role: req.session.roles[0],
        ticket: ticket,
        logs: await funcs.getLogs(id),
        categories: await funcs.getCategories(),
        files: await funcs.getFiles(id),
        agents,
        posts: await funcs.getKnowledgeBoardPostsByCategory(ticket.category_name)
    };

    res.render("ticket_details", data);
});

router.post("/dashboard/:id/claimTicket", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const ticket_id = req.params.id;
    const user = req.user;
    await funcs.claimTicket(user.id, user.displayName, user.emails[0].value, ticket_id);
    await funcs.addSystemLog(ticket_id, `Ticket claimed by agent: ${user.displayName}.`)
    await funcs.sendUpdateMail(req.session.roles[0], ticket_id)
    res.redirect(`/dashboard/${ticket_id}`);
});

router.post("/dashboard/:id/closeTicket", isAuthenticated, ticketAccess, async (req, res) => {
    const ticket_id = req.params.id;
    await funcs.closeTicket(ticket_id);
    await funcs.addSystemLog(ticket_id, `Issue has been resolved.`)
    await funcs.sendUpdateMail(req.session.roles[0], ticket_id, "closed")
    res.redirect("/dashboard");
});

router.post("/dashboard/:id/comment", isAuthenticated, ticketAccess, async (req, res) => {
    const ticket_id = req.params.id;
    const { comment, author} = req.body;
    await funcs.newComment(ticket_id, author, comment);
    await funcs.sendUpdateMail(req.session.roles[0], ticket_id, "comment", comment)
    res.redirect(`/dashboard/${ticket_id}`);
});

router.post("/dashboard/:id/changeCategory", isAuthenticated, ticketAccess, ensureAgentOrAdmin, async (req, res) => {
    const ticket_id = req.params.id;
    const { selected_category_value, selected_category_text } = req.body;
    await funcs.changeCategory(ticket_id, selected_category_value)
    await funcs.addSystemLog(ticket_id, `Ticket category changed to: ${selected_category_text}.`)
    await funcs.sendUpdateMail(req.session.roles[0], ticket_id)
    res.redirect(`/dashboard/${ticket_id}`);
});

router.post("/dashboard/:id/requestReopenTicket", isAuthenticated, ticketAccess, async (req, res) => {
    const ticket_id = req.params.id;
    await funcs.requestReopenTicket(ticket_id)
    await funcs.addSystemLog(ticket_id, `Reopening of ticket requested.`)
    res.redirect(`/dashboard/${ticket_id}`);
});

router.post("/dashboard/:id/acceptReopenTicket", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const ticket_id = req.params.id;
    await funcs.acceptReopenTicket(ticket_id)
    await funcs.addSystemLog(ticket_id, `Ticket reopened.`)
    res.redirect(`/dashboard/${ticket_id}`);
});

router.post("/dashboard/:id/changeAgent", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const { new_agent_index } = req.body;
    console.log(new_agent_index)
    const new_agent_name = req.session.agents[new_agent_index].name;
    const new_agent_email = req.session.agents[new_agent_index].email;
    const new_agent_id = req.session.agents[new_agent_index].user_id;
    const ticket_id = req.params.id;
    await funcs.changeAgent(new_agent_name, new_agent_email, new_agent_id, ticket_id);
    await funcs.addSystemLog(ticket_id, `Agent changed to ${new_agent_name}.`)
    res.redirect(`/dashboard/${ticket_id}`);
});

router.get("/agentPanel", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const user = req.user;

    let data = {
        title: "Agent Panel",
        user,
        reopen_requests: await funcs.getRequestsReopenTicket(user.id),
        user_creation_requests: await funcs.getRequestsCreateUser(),
        role: req.session.roles[0]
    };

    res.render("agent_panel", data);
});

router.post("/agentPanel/createUser", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const { email, name, password, role } = req.body;
    await funcs.createUser(email, name, password, role)
    res.redirect(`/agentPanel`);
});

router.post("/agentPanel/acceptCreateUser", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const { email, name, role } = req.body;
    await funcs.acceptCreateUser(email, name, role)
    res.redirect(`/agentPanel`);
});

router.post("/agentPanel/denyCreateUser", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const { email } = req.body;
    await funcs.denyCreateUser(email)
    res.redirect(`/agentPanel`);
});

router.get("/knowledgeBoard", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    let data = {
        title: "Agent Panel",
        user: req.user,
        posts: await funcs.getKnowledgeBoardPosts(),
        categories: await funcs.getCategories()
    };

    res.render("knowledge_board", data);
});

router.post("/knowledgeBoard/newPost", isAuthenticated, ensureAgentOrAdmin, async (req, res) => {
    const { author, content, category } = req.body;
    console.log(category)
    await funcs.newKnowledgeBoardPost(author, content, category);
    res.redirect(`/knowledgeBoard`);
});


module.exports = router;