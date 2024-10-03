const modal = document.getElementById("my_modal");
const close_button = document.getElementsByClassName("close")[0];
const email_input = document.getElementById("email");
const name_input = document.getElementById("name");

// Function to open modal
function openUserCreationMenu(email){
    modal.style.display = "block";
    email_input.value = email;
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

document.getElementById("accept_user_creation_form").onsubmit = function() {
    email_input.disabled = false;
    name_input.disabled = false;
}