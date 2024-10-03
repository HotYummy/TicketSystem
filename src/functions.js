/**
 * A module exporting functions to access the bank database.
 */
"use strict";

module.exports = {
    createTicket,
    getTickets,
    getTicketsByUserId,
    getTicketByTicketId,
    closeTicket,
    getCategories,
    getLogs,
    newComment,
    createCategory,
    claimTicket,
    sendUpdateMail,
    changeCategory,
    addSystemLog,
    requestReopenTicket,
    acceptReopenTicket,
    getRequestsReopenTicket,
    createUser,
    getRequestsCreateUser,
    requestCreateUser,
    acceptCreateUser,
    updateUserOnFirstLogin,
    uploadFiles,
    getFiles,
    generateRandomPassword,
    checkWhenLastReply,
    getAccessToken,
    changeAgent,
    newKnowledgeBoardPost,
    getKnowledgeBoardPosts,
    getKnowledgeBoardPostsByCategory,
    denyCreateUser
};

const mysql  = require("promise-mysql");
const dbConfig = require("../config/db/config.json");
const config = require("../config/config.json")
const { query } = require("express");
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const mailer = require("../services/mailer.js");
const axios = require("axios");
let db;

async function getAccessToken() {
    const options = {
      method: 'POST',
      url: `https://${config.Auth0.CLIENT_DOMAIN}/oauth/token`,
      headers: { 'content-type': 'application/json' },
      data: {
        grant_type: 'client_credentials',
        client_id: config.Auth0.CLIENT_ID,
        client_secret: config.Auth0.CLIENT_SECRET,
        audience: `https://${config.Auth0.CLIENT_DOMAIN}/api/v2/`,
        scope: "create:users update:roles update:users read:roles read:users"
      }
    };
  
    try {
      const response = await axios(options);
      return response.data.access_token;
    } catch (error) {
      console.error('Error retrieving access token:', error.response.data);
      return null;
    }
};

function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

(async function() {
    db = await mysql.createConnection(dbConfig);

    process.on("exit", () => {
        db.end();
    });
})();

async function createTicket(title, author_id, author_email, author_name, category_id, data) {
    let sql = "CALL create_ticket(?, ?, ?, ?, ?, ?);"

    try {
        let res = await db.query(sql, [title, author_id, author_email, author_name, category_id, data]);
        return res[0];
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function createCategory(category_name) {
    let sql = "CALL create_category(?);"

    try {
        await db.query(sql, [category_name]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function claimTicket(agent_id, agent_name, agent_email, ticket_id) {
    let sql = "CALL claim_ticket(?, ?, ?, ?);"

    try {
        await db.query(sql, [agent_id, agent_name, agent_email, ticket_id]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getCategories() {
    let sql = "SELECT * FROM Categories;"

    try {
        const res = await db.query(sql);
        return res;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getTickets() {
    let sql = `CALL get_tickets()`;

    try {
        const res = await db.query(sql);
        const now = momentTimezone.tz("Europe/Stockholm");
        for(let i = 0; i < res[0].length; i++){
            const lastChange = res[0][i].formatted_updated_at ? res[0][i].formatted_updated_at : res[0][i].formatted_opened_at;
            const timeSinceLastChange = moment(lastChange).subtract(2, "hours").fromNow();
            res[0][i].time_since_change = timeSinceLastChange;
        }
        return res[0];
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getTicketsByUserId(id) {
    let sql = `CALL get_tickets_user_id(?)`;

    try {
        const res = await db.query(sql, [id]);
        const now = momentTimezone.tz("Europe/Stockholm");

        for(let i = 0; i < res[0].length; i++){
            const lastChange = res[0][i].formatted_updated_at ? res[0][i].formatted_updated_at : res[0][i].formatted_opened_at;
            const timeSinceLastChange = moment(lastChange).subtract(2, "hours").fromNow();
            res[0][i].time_since_change = timeSinceLastChange;
        }
        return res[0];
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getTicketByTicketId(id) {
    let sql = `CALL get_tickets_ticket_id(?)`;

    try {
        const res = await db.query(sql, [id]);
        const now = momentTimezone.tz("Europe/Stockholm");

        const timeSinceLastChange = moment(res[0][0].formatted_opened_at).subtract(2, "hours").fromNow();
        res[0][0].time_since_change = timeSinceLastChange;
        return res[0][0];
    } catch (error) {
        console.error("Error executing query:", error);
        return null;
    }
}

async function closeTicket(id) {
    let sql = "CALL close_ticket(?)"
    try {
        await db.query(sql, [id]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getLogs(id) {
    let sql = "CALL get_logs(?)"
    try {
        const res = await db.query(sql, [id]);
        return res[0];
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function newComment(id, author, comment) {
    let sql = "CALL new_comment(?, ?, ?)"
    try {
        await db.query(sql, [id, author, comment]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function sendUpdateMail(role, ticket_id, event = "", comment = "") {
    let ticket = await getTicketByTicketId(ticket_id);
    try{
        if(role == "User") {
            if(ticket.agent_email != null){
                mailer.sendMail(ticket.agent_email, ticket.title, ticket_id, event, comment)
            } else {
                console.log("Mail not sent, no agent assigned.")
            }
        } else {
            mailer.sendMail(ticket.author_email, ticket.title, ticket_id, event, comment)
        }
    }
    catch (error){
        console.error("There was an error sending the email: ", error)
        throw error;
    }
} 

async function changeCategory(ticket_id, category_id) {
    let sql = "CALL change_category(?, ?)";

    try{
        await db.query(sql, [ticket_id, category_id])
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function addSystemLog(id, comment) {
    let sql = "CALL new_system_log(?, ?)"
    try {
        await db.query(sql, [id, comment]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function requestReopenTicket(ticket_id) {
    let sql = "CALL request_reopen_ticket(?)"
    try {
        await db.query(sql, [ticket_id]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function acceptReopenTicket(ticket_id) {
    let sql = "CALL accept_reopen_ticket(?)"
    try {
        await db.query(sql, [ticket_id]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getRequestsReopenTicket(agent_id) {
    let sql = "CALL get_requests_reopen_ticket(?)"
    try {
        let res = await db.query(sql, [agent_id]);
        return res[0];
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function requestCreateUser(user_email, user_message) {
    let sql = "CALL request_create_user(?, ?)"
    try {
        await db.query(sql, [user_email, user_message]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function acceptCreateUser(user_email, user_name, user_role) {
    let sql = "CALL accept_create_user(?)"
    const user_password = generateRandomPassword();

    try {
        await createUser(user_email, user_name, user_password, user_role);
        await db.query(sql, [user_email]);
        mailer.sendMail(user_email, "", null, "user_created", "", user_password);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function denyCreateUser(user_email) {
    // Deletes the request from the table, name is confusing but can be used for both accept and deny.
    let sql = "CALL accept_create_user(?)"

    try {
        await db.query(sql, [user_email]);
        mailer.sendMail(user_email, "", null, "user_denied");
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getRequestsCreateUser() {
    let sql = "CALL get_requests_create_user()"
    try {
        let res = await db.query(sql);
        return res[0];
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function createUser(new_email, new_name, new_password, new_role) {
    const access_token = await getAccessToken();
    
    const options = {
        method: 'POST',
        url: `https://${config.Auth0.CLIENT_DOMAIN}/api/v2/users`,
        headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        },
        data: {
            name: new_name,
            email: new_email,
            password: new_password,
            connection: 'Username-Password-Authentication'
        }
    };
  
    try {
        const response = await axios(options);
        console.log('User created successfully:', response.data);

        const new_user_id = response.data.user_id;

        const role_assignment_options = {
            method: 'POST',
            url: `https://${config.Auth0.CLIENT_DOMAIN}/api/v2/roles/${new_role}/users`,
            headers: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            data: {
                users: [new_user_id]
            }
        };

        const role_response = await axios(role_assignment_options);
        console.log('Role assigned successfully:', role_response.data);

    } catch (error) {
        console.error('Error creating user or assigning role:', error.response.data);
    }
}

async function updateUserOnFirstLogin(user_id, new_name, new_password){
    const accessToken = await getAccessToken();

    const options = {
        method: 'PATCH',
        url: `https://${config.Auth0.CLIENT_DOMAIN}/api/v2/users/${user_id}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        data: {
            name: new_name,
            password: new_password
        }
    };

    try {
        const response = await axios(options);
        console.log('User updated successfully:', response.data);
    } catch (error) {
        console.error('Error updating user:', error.response.data);
    }
}

async function uploadFiles(path, ticket_id) {
    let sql = "CALL add_ticket_files(?, ?)"

    try{
        await db.query(sql, [path, ticket_id]);
        return true;
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getFiles(ticket_id) {
    let sql = "CALL get_ticket_files(?)"

    try{
        let res = await db.query(sql, [ticket_id]);
        return res[0];
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function checkWhenLastReply() {
    let sql = "CALL get_open_tickets()";

    try{
        let res = await db.query(sql);
        for(const ticket of res[0]){
            let sql = "CALL get_logs(?)";

            try {
                let res = await db.query(sql, [ticket.id])
                
                for(const log of res[0]){
                    let log_timestamp = new Date(log.formatted_timestamp);
                    let current_timestamp = new Date();
                    current_timestamp.setHours(current_timestamp.getHours() + 2);
                    const difference_in_days = (current_timestamp - log_timestamp) / (1000 * 60 * 60 * 24);
                    if(log.author == ticket.agent_name && !log.notification_sent && difference_in_days > 3){
                        console.log(log)
                        mailer.sendMail(config.mailer.SUPER_ADMIN_MAIL, ticket.title, ticket.id, "3_day_notifcation", "", "", ticket.agent_name);
                        let sql = "UPDATE Logs SET notification_sent = 1 WHERE log_id = (?)";
                        console.log()

                        try{
                            await db.query(sql, [log.log_id]);
                            return true;
                        } catch (error) {
                            console.error("Error executing query:", error);
                            throw error;
                        }
                    }
                }
            } catch (error) {
                console.error("Error executing query:", error);
                throw error;
            }
        }
    } catch (error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function changeAgent(new_agent_name, new_agent_email, new_agent_id, ticket_id) {
    let sql = "CALL change_agent(?, ?, ?, ?)";

    try{
        await db.query(sql, [new_agent_name, new_agent_email, new_agent_id, ticket_id]);
        return true;
    } catch(error){
        console.error("Error executing query:", error);
        throw error;
    }
}

async function newKnowledgeBoardPost(author, content, category) {
    let sql = "CALL new_knowledge_board_post(?, ?, ?)";

    try{
        await db.query(sql, [author, content, category]);
        return true;
    } catch(error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getKnowledgeBoardPosts() {
    let sql = "CALL get_knowledge_board_posts()";

    try{
        let res = await db.query(sql);
        return res[0];
    } catch(error) {
        console.error("Error executing query:", error);
        throw error;
    }
}

async function getKnowledgeBoardPostsByCategory(category) {
    let sql = "CALL get_knowledge_board_posts_by_category(?)";

    try{
        let res = await db.query(sql, [category]);
        return res[0];
    } catch(error) {
        console.error("Error executing query:", error);
        throw error;
    }
}