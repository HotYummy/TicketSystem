const Imap = require('imap');
const fs = require('fs-extra');
const {simpleParser} = require('mailparser');
const funcs = require("../src/functions.js");
const config = require("../config/config.json");
const user_data_json = './user_data.json';
const axios = require('axios');
const nodemailer = require('nodemailer');
const FormData = require("form-data");
const imapConfig = {
  user: config.mailer.EMAIL_ADRESS,
  password: config.mailer.APPLICATION_PASSWORD,
  host: config.mailer.HOST,
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
}

module.exports = {
  sendMail
}

//
// I/O JSON FILE
//

const readUserData = async () => {
  try {
    if (await fs.pathExists(user_data_json)) {
      return await fs.readJson(user_data_json);
    } else {
      return {};
    }
  } catch (err) {
    console.error('Error reading user data:', err);
    return {};
  }
};

const writeUserData = async (data) => {
  try {
    await fs.writeJson(user_data_json, data, { spaces: 2 });
  } catch (err) {
    console.error('Error writing user data:', err);
  }
};

//
// FETCHING
//

const fetchEmails = async () => {
  funcs.checkWhenLastReply();

  try {
    const imap = new Imap(imapConfig);
    let user_data = await readUserData();
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
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

                if(!sender.includes("no-reply") || !sender.includes("mailer-daemon")){
                  const is_reply = subject.split(":")[0] == "Sv" || subject.split(":")[0] == "Re";

                  if(sender in user_data) {
                    sender_id = user_data[sender]["id"];
                    sender_name = user_data[sender]["name"];
                  } else {
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
                    
                    if (response.data.length > 0) {
                      sender_id = response.data[0].user_id;
                      sender_name = response.data[0].name;
                      user_data[sender] = {"id": sender_id, "name": sender_name};
                      await writeUserData(user_data);
                    } else {
                      if(sender.includes(config.mailer.BYPASS_DOMAIN)){
                        const user_password = funcs.generateRandomPassword();
                        console.log("BTH domain recognized, creating user...")
                        await funcs.createUser(sender, "Temp", user_password, "rol_n3r9Bk6sdCqkN5XN");
                        sendMail(sender, "", null, "user_created", "", user_password);
                      } else{
                        console.log("User not found, requesting user creation...")
                        await funcs.requestCreateUser(sender, text);
                        sendMail(sender, "", null, "requested_user_creation", "");
                      }
                    }
                  }
                  if(sender_name && sender_id){
                    if(is_reply){
                      let ticket_id = subject.split("ID: ")[1]
                      new_comment = parsed.textAsHtml.split("<p>")[1].split("</p>")[0]
                      funcs.newComment(ticket_id, sender_name, new_comment);
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

setInterval(fetchEmails, 30000);

//
// SENDING
//

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.mailer.EMAIL_ADRESS,
    pass: config.mailer.APPLICATION_PASSWORD
  }
});

function sendMail(recipient, ticket_name, ticket_id, event, comment = "", user_password = "", agent_name = "") {
  var mailOptions;
  if(event == "requested_user_creation"){
    mailOptions = {
      from: config.mailer.EMAIL_ADRESS,
      to: recipient,
      subject: ' Your request to create an account has been made! ',
      html: `
      <p>Your request to create an account has been recieved and is awaiting reviewal from one of our agents.</p> 
      <p>You will recieve an email containing a password once your request has been accepted.</p>
      `
    };
  } else if(event == "user_created"){
    mailOptions = {
      from: config.mailer.EMAIL_ADRESS,
      to: recipient,
      subject: ' Your account has been created! ',
      html: `
      <p>Your account has been created!</p>
      <p>Your password is: <strong>${user_password}</strong></p>
      <p>To start using the TicketSystem, please go to <a href="http://79.76.63.170:3000/login">79.76.63.170:3000/login</a>.</p>
      `
    };
  } else if(event == "closed"){
    mailOptions = {
      from: config.mailer.EMAIL_ADRESS,
      to: recipient,
      subject: ' Your ticket has been closed. ',
      text: `Your ticket: "${ticket_name}", has been closed. To see your tickets, please go to 79.76.63.170:3000/login`
    };
  } else if(event == "comment"){
    mailOptions = {
      from: config.mailer.EMAIL_ADRESS,
      to: recipient,
      subject: ` Your ticket has a new comment. Ticket ID: ${ticket_id}`,
      text: `Your ticket: "${ticket_name}", has a new comment: "${comment}". To see your tickets, please go to 79.76.63.170:3000/login`
    };
  } else if(event == "3_day_notifcation"){
    mailOptions = {
      from: config.mailer.EMAIL_ADRESS,
      to: recipient,
      subject: ` A ticket has gone unanswered for more than 3 days! Ticket ID: ${ticket_id}`,
      text: `The ticket: "${ticket_name}", has not been attended to for more than 3 days.\n\n The agent assigned to the ticket is: ${agent_name}`
    };
  } else if(event == "user_denied"){
    mailOptions = {
      from: config.mailer.EMAIL_ADRESS,
      to: recipient,
      subject: ` Your request to create an account has been denied. `,
      text: ` Your request to create an account has been denied by one of our agents. `
    };
  } else{
    mailOptions = {
      from: config.mailer.EMAIL_ADRESS,
      to: recipient,
      subject: ` There has been an update in your ticket. Ticket ID: ${ticket_id}`,
      text: `There has been an update in your ticket: "${ticket_name}". To see your tickets, please go to 79.76.63.170:3000/login`
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
