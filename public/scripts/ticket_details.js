var modal = document.getElementById("my_modal");
var new_comment_button = document.getElementById("new_comment");
var close_button = document.getElementsByClassName("close")[0];

// Open the modal when the new ticket button is clicked
if(new_comment_button){
  new_comment_button.onclick = function() {
    modal.style.display = "block";
  };
}

// Close the modal when the close button is clicked
close_button.onclick = function() {
  modal.style.display = "none";
};

// Close the modal if the user clicks anywhere outside it
window.onclick = function(event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Functionality for the image modal
var imageModal = document.getElementById("image_modal");
var modal_image = document.getElementById("modal_image");
var image_caption = document.getElementById("image_caption");

// Function to open the image modal
function openImageModal(img) {
    imageModal.style.display = "flex";
    modal_image.src = "/uploads/" + img;
}

// Close the image modal when the user clicks anywhere outside of the image
window.onclick = function(event) {
    if (event.target === imageModal) {
        imageModal.style.display = "none";
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

for(i = 0; i < comments.length; i++){
  if(comments[i].innerText.includes("System")){
    comments[i].getElementsByClassName("comment_text")[0].style.backgroundColor = "#d7f2e0";
  }
  if(comments[i].innerText.split("\n")[0] == ticket.agent_name){
    comments[i].getElementsByClassName("comment_text")[0].style.backgroundColor = "#d6c4f2";
  }
}

// Change the category of the ticket as an agent
function changeAgent() {
  const select_agent = document.getElementById("selected_agent");
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