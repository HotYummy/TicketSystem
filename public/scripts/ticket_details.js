var modal = document.getElementById("ticket_modal");
var new_comment_button = document.getElementById("new_comment");

if(new_comment_button){
  new_comment_button.onclick = function() {
    modal.style.display = "block";
  };
}

window.onclick = function(event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

var imageModal = document.getElementById("image_modal");
var modal_image = document.getElementById("modal_image");
var image_caption = document.getElementById("image_caption");

function openImageModal(img) {
    imageModal.style.display = "flex";
    modal_image.src = "/uploads/" + img;
}

window.onclick = function(event) {
  if (event.target === imageModal) {
    imageModal.style.display = "none";
  }
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Change the category of the ticket as an agent
function changeCategory() {
  const select_element = document.getElementById("selected_category");
  const selected_category_value = select_element.value;
  const selected_category_text = select_element.options[select_element.selectedIndex].text;

  fetch(`/dashboard/${ticket.id}/changeCategory`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ selected_category_value: selected_category_value, selected_category_text: selected_category_text })
  })
  .then(() => {
      console.log('Request sent successfully');
  })
  .catch(error => {
      console.error('Error:', error);
  });

  location.reload();
}

// Make the system comments slightly darker
const comments = document.getElementById("comments_container").getElementsByClassName("comment");

for(let i = 0; i < comments.length; i++){
  if(comments[i].innerText.includes("System")){
    comments[i].getElementsByClassName("comment_text")[0].style.backgroundColor = "#d7f2e0";
  }
  if(comments[i].innerText.split("\n")[0] == ticket.agent_name){
    comments[i].getElementsByClassName("comment_text")[0].style.backgroundColor = "#d6c4f2";
  }
}

// Change the category of the ticket as an agent
const select_agent = document.getElementById("selected_agent");

function changeAgent() {
  const new_agent_index = select_agent.value;
  const selected_agent_text = select_agent.options[select_agent.selectedIndex].text;
  if(selected_agent_text != ticket.agent_name){
    fetch(`/dashboard/${ticket.id}/changeAgent`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ new_agent_index: new_agent_index })
    })
    .then(() => {
        console.log('Request sent successfully');
    })
    .catch(error => {
        console.error('Error:', error);
    });
  
    location.reload();
  }
}

if(select_agent){
  for(let i = 0; i < select_agent.options.length; i++){
    if (select_agent.options[i].text == user.displayName){
      select_agent.options[i].text += " (Me)"; 
    }
  }
}

if(role == "User") {
  document.getElementById("floating_container").style.width = "100%";
}

if(files.length == 0){
  document.getElementById("attachments_container").style.display = "none";
  document.getElementsByClassName("horizontal_divider")[1].style.display = "none";
}

if(role == "User"){
  const sidebar_buttons = document.getElementsByClassName("sidebar_button");
  sidebar_buttons[1].style.color = "grey";
  sidebar_buttons[1].disabled = true;
  sidebar_buttons[2].style.color = "grey";
  sidebar_buttons[2].disabled = true;
}

let notif = false;
let i = 0;

while(notif == false && i < tickets.length){
  if((tickets[i].unread_agent && tickets[i].agent_name == user.displayName && role != "User") || (tickets[i].unread_user && role == "User")){
    notif = true;
  }
  i++;
}

if(notif == true){
  document.getElementsByClassName("sidebar_button")[0].innerHTML += '<span class="material-symbols-outlined">notifications</span>'
}

if(role == "Super Admin" && update_tickets.length > 0){
  document.getElementsByClassName("sidebar_button")[2].innerHTML += `<div id="update_amount">(${update_tickets.length})</div>`
}

function comment(content){
  fetch(`/dashboard/${ticket.id}/comment`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comment: content, author: user.displayName })
  })
  .then(() => {
      console.log('Request sent successfully');
  })
  .catch(error => {
      console.error('Error:', error);
  });

  location.reload();
}