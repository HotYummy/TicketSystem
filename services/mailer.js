const Imap = require('imap');

const {simpleParser} = require('mailparser');
const funcs = require("../src/functions.js");
const config = require("../config/config.json");
const axios = require('axios');
const nodemailer = require('nodemailer');
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const imapConfig = {
  user: config.mailer.EMAIL_ADDRESS,
  password: config.mailer.APPLICATION_PASSWORD,
  host: config.mailer.HOST,
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
}

function cacheMail(sender, text, subject, attachments) {
  file_path = path.join(__dirname, '../mailer_cache.json');
  fs.readFile(file_path, 'utf8', (err, data) => {
    if (err) {
        console.log("Error reading mailer_cache.json: ", err);
    }

    const cached_emails = JSON.parse(data);

    if (!cached_emails[sender]) {  
      cached_emails[sender] = [{
        "text": text,
        "title": subject,
        "attachments": attachments
      }];
    } else {
      cached_emails[sender].push({
        "text": text,
        "title": subject,
        "attachments": attachments
      });
    }

    fs.writeFile(file_path, JSON.stringify(cached_emails, null, 2), (err) => {
      if (err) {
        console.log("Error writing to mailer_cache.json: ", err);
      }
    });
  });
}


module.exports = {
  sendMail
}

//
// FETCHING
//

const fetchEmails = async () => {
  try {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        console.log('Connection ready. Listening for new emails...');

        imap.on('mail', () => {
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              console.error('Error searching inbox:', err);
              return imap.end();
            }

            if (results.length === 0) {
              console.log('No new emails found.');
              return;
            }

            const f = imap.fetch(results, { bodies: '' });
            f.on('message', msg => {
              msg.on('body', stream => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err);
                    return;
                  }

                  const sender = parsed.from.value[0].address;
                  const { subject, text } = parsed;

                  var sender_id;
                  var sender_name;

                  if(!sender.includes("no-reply") && !sender.includes("mailer-daemon")){
                    const is_reply = subject.split(":")[0] == "Sv" || subject.split(":")[0] == "Re";

                    let response = await axios.post(`https://${config.Auth0.CLIENT_DOMAIN}/oauth/token`, {
                      grant_type: 'client_credentials',
                      client_id: config.Auth0.CLIENT_ID,
                      client_secret: config.Auth0.CLIENT_SECRET,
                      audience: `https://${config.Auth0.CLIENT_DOMAIN}/api/v2/`
                    });
                    
                    const accessToken = response.data.access_token;
                  
                    response = await axios.get(`https://${config.Auth0.CLIENT_DOMAIN}/api/v2/users`, {
                      headers: {
                        Authorization: `Bearer ${accessToken}`
                      },
                      params: {
                        q: `email:"${sender}"`,
                        search_engine: 'v3'
                      }
                    });
                    if (response.data.length > 0 && response.data[0].name != "Temp") {
                      sender_id = response.data[0].user_id;
                      sender_name = response.data[0].name;
                    } else if(response.data.length > 0 && response.data[0].name == "Temp") {
                      sendMail(sender, "", null, "user_first_login", "");
                      cacheMail(sender, text, subject, parsed.attachments);
                    } else {
                      if(sender.split("@")[1].includes(config.mailer.BYPASS_DOMAIN)){
                        const user_password = funcs.generateRandomPassword();
                        console.log("BTH domain recognized, creating user...")
                        await funcs.createUser(sender, "Temp", user_password, "rol_n3r9Bk6sdCqkN5XN");
                        file_path = path.join(__dirname, '../mailer_cache.json');
                        fs.readFile(file_path, 'utf8', async (err, data) => {
                          if (err) {
                              console.log("Error reading mailer_cache.json: ", err);
                          }
                      
                          const cached_emails = JSON.parse(data);
                      
                          if(cached_emails[sender]){
                            sendMail(sender, "", null, "user_first_login", "");
                          } else {
                            sendMail(sender, "", null, "user_created", "", user_password);
                          }
                          cacheMail(sender, text, subject, parsed.attachments);
                        });                

                      } else{   
                        file_path = path.join(__dirname, '../mailer_cache.json');
                        fs.readFile(file_path, 'utf8', async (err, data) => {
                          if (err) {
                              console.log("Error reading mailer_cache.json: ", err);
                          }
                      
                          const cached_emails = JSON.parse(data);
                      
                          if(!cached_emails[sender]){
                            console.log("User not found, requesting user creation...")
                            await funcs.requestCreateUser(sender);
                            sendMail(sender, "", null, "requested_user_creation", "");
                          } else {
                            sendMail(sender, "", null, "duplicate_request_user_creation", "");
                          }
                        });                
                        cacheMail(sender, text, subject, parsed.attachments);
                      }
                    }

                    if(sender_name && sender_id){
                      if(is_reply){
                        let new_comment = "";
                        let line = "";
                        for(let i = 0; !line.includes("pa1414.example@gmail.com") && line != "________________________________"; i++){
                          new_comment += line + "\n";
                          line = parsed.text.split("\n")[i];
                        }
                        let ticket_id = subject.split("ID: ")[1]
                        let ticket = await funcs.getTicketByTicketId(ticket_id);
                        if(sender_name == ticket.agent_name){
                          funcs.updateUnread("User", ticket_id, true);
                          funcs.newComment(ticket_id, sender_name, new_comment, sender, "Agent");
                        } else {
                          funcs.updateUnread("Agent", ticket_id, true);
                          funcs.newComment(ticket_id, sender_name, new_comment, sender, "User");
                        }
                      } else{
                        let ticket_id = await funcs.createTicket(subject, sender_id, sender, sender_name, null, text);
                        if (parsed.attachments && parsed.attachments.length > 0) {
                          const formData = new FormData();
      
                          parsed.attachments.forEach(file => {
                            const buffer = Buffer.from(file.content);
                            formData.append('uploads', buffer, { filename: file.filename, contentType: file.contentType });
                          });
      
                          formData.append("ticket_id", ticket_id[0].id);
      
                          axios.post('http://79.76.63.170:3000/uploadFiles', formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                          })
                          .then(response => {
                            console.log('Response:', response.data);
                          })
                          .catch(error => {
                            console.error('Error uploading files:', error);
                          });
                        }
                      }
                    }
                  }
                });
              });

              msg.once('attributes', attrs => {
                const { uid } = attrs;
                imap.addFlags(uid, ['\\Seen'], () => {
                  console.log('Marked as read!');
                });
              });
            });

            f.once('error', ex => {
              console.error('Fetch error:', ex);
            });

            f.once('end', () => {
              console.log('Done fetching all messages!');
            });
          });
        });
      });
    });

    imap.once('error', err => {
      console.error('IMAP error:', err);
    });

    imap.once('end', () => {
      console.log('Connection ended');
    });

    imap.connect();
  } catch (ex) {
    console.error('An error occurred:', ex);
  }
};

fetchEmails();

//
// SENDING
//

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.mailer.EMAIL_ADDRESS,
    pass: config.mailer.APPLICATION_PASSWORD
  }
});

function sendMail(recipient, ticket_name, ticket_id, event, comment = "", user_password = "", agent_name = "") {
  console.log(event)
  var mailOptions;
  if(event == "requested_user_creation"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ' Your request to create an account has been made! ',
      html: `
      <p>Your request to create an account has been recieved and is pending reviewal from one of our agents.</p> 
      <br>
      <p>You will recieve an email containing a password once your request has been accepted.</p>
      `
    };
  } else if(event == "user_created"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ' Your account has been created! ',
      html: `
      <p>Your account has been created!</p>
      <br>
      <p>Your password is: <strong>${user_password}</strong></p>
      <br>
      <p>To start using the TicketSystem, please go to <a href="${config.Auth0.LOGOUT_URL}"><strong>${config.Auth0.LOGOUT_URL}</strong></a>.</p>
      `
    };
  } else if(event == "closed"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ' Your ticket has been closed. ',
      html: `
      <p>Your ticket <strong>"${ticket_name}"</strong> has been closed.</p>
      <br>
      <p>If you wish to see your tickets, or request a reopening of a closed ticket, please go to:  <a href="${config.Auth0.LOGOUT_URL}"><strong>${config.Auth0.LOGOUT_URL}</strong></a>.</p>
      `
    };
  } else if(event == "comment"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ` Your ticket has a new comment. Ticket ID: ${ticket_id}`,
      html: `
      <p>Your ticket <strong>"${ticket_name}"</strong> has a new comment.</p>
      <br>
      <p>New comment: <em>"${comment}"</em></p>
      <br>
      <p>You can respond either by replying to this email, or by going to:  <a href="${config.Auth0.LOGOUT_URL}"><strong>${config.Auth0.LOGOUT_URL}</strong></a>.</p>
      `
    };
  } else if(event == "user_first_login"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ` Choose name and password. `,
      html: `
      <p>You need to choose a name and password before creating a new ticket. </p>
      <br>
      <p>To choose a name and password, please go to:  <a href="${config.Auth0.LOGOUT_URL}"><strong>${config.Auth0.LOGOUT_URL}</strong></a> and login with the password you have been provided.</p>
      `
    };
  } else if(event == "3_day_notifcation"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ` A ticket has gone unanswered for more than 3 days! Ticket ID: ${ticket_id}`,
      html: `
      <p>The ticket: <strong>"${ticket_name}"</strong>, has not been attended to for more than 3 days.</p>
      <br>
      <p>The agent assigned to the ticket is: <em>${agent_name}</em></p>
      <br>
      <p>To handle your tickets, please go to:  <a href="${config.Auth0.LOGOUT_URL}"><strong>${config.Auth0.LOGOUT_URL}</strong></a>.</p>
      `
    };
  } else if(event == "ticket_assigned"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ` A new ticket has been assigned to you! Ticket ID: ${ticket_id}`,
      html: `
      <p>The ticket: <strong>"${ticket_name}"</strong>, has been assigned to you.</p>
      <br>
      <p>To handle your tickets, please go to:  <a href="${config.Auth0.LOGOUT_URL}"><strong>${config.Auth0.LOGOUT_URL}</strong></a>.</p>
      `
    };
  } else if(event == "user_denied"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ` Your request to create an account has been denied. `,
      text: ` Your request to create an account has been denied by one of our agents. `
    };
  } else if(event == "duplicate_request_user_creation"){
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ` Your request to create an account has already been made. `,
      text: ` Your request to create an account has already been made, please wait for one of our agents to accept your request. `
    };
  } else{
    mailOptions = {
      from: config.mailer.EMAIL_ADDRESS,
      to: recipient,
      subject: ` There has been an update in your ticket. Ticket ID: ${ticket_id}`,
      html: `
      <p>The ticket: <strong>"${ticket_name}"</strong> has a new update!</p>
      <br>
      <p>To view your tickets, please go to:  <a href="${config.Auth0.LOGOUT_URL}"><strong>${config.Auth0.LOGOUT_URL}</strong></a>.</p>
      `
    };
  }
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(' Error:', error.message);
    } else {
      console.log(' Email sent:', info.response);
    }
  });
}
