const funcs = require("../src/functions.js")

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user) {
        return next();
    } else {
        // User is not authenticated
        res.redirect('/login');  // Redirect to the login page or any other route
    }
}

function ensureAgentOrAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user) {
      if (req.session.roles && (req.session.roles.includes('Agent') || req.session.roles.includes('Super Admin'))) {
          return next();
      } else {
          res.status(403).send('Access Denied');
      }
  } else {
      res.redirect('/login');
  }
}

function ensureUser(req, res, next) {
  if (req.isAuthenticated() && req.user) {
      if (req.session.roles && req.session.roles.includes('User')) {
          return next();
      } else {
          res.status(403).send('Access Denied');
      }
  } else {
      res.redirect('/login');
  }
}

async function ticketAccess(req, res, next) {
    if(req.session.roles[0] == "User"){
        const user_id = req.user?.id;
        const ticket_id = req.params.id;
    
        const ticket = await funcs.getTicketByTicketId(ticket_id)
        console.log(ticket, user_id, ticket_id)
        if(!ticket){
            return res.status(404).send("Ticket not found!");
        }
    
        if(ticket.author_id == user_id){
            return next();
        } else {
            return res.status(403).send("Access Denied!");
        }
    }
    return next();
}

module.exports = {
    isAuthenticated,
    ensureAgentOrAdmin,
    ensureUser,
    ticketAccess
};