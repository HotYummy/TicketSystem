const modal = document.getElementById("my_modal");
const new_post_button = document.getElementById("new_post");
const close_buttons = document.getElementsByClassName("close");

// Open the modal when the new post button is clicked
new_post_button.onclick = function() {
  modal.style.display = "block";
};

// Close the modal when the close button is clicked
close_buttons[0].onclick = function() {
  modal.style.display = "none";
};

// Close the modal if the user clicks anywhere outside it
window.onclick = function(event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// // Search functionality for the searchbar
// document.getElementById('searchbar').addEventListener('input', function() {
//   const search_query = this.value.toLowerCase();
//   const rows = document.querySelectorAll('#post_table tbody tr');

//   rows.forEach(row => {
//     const cells = row.querySelectorAll('td');
//     const row_contains_query = Array.from(cells).some(cell =>
//       cell.textContent.toLowerCase().includes(search_query)
//     );
//     row.style.display = row_contains_query ? '' : 'none';
//   });
// });

// const first_login_modal = document.getElementById("first_login_modal");

// function validatePassword(password) {
//   console.log(password);
//   const minLength = 8;
//   const upperCasePattern = /[A-Z]/;
//   const lowerCasePattern = /[a-z]/;
//   const numberPattern = /[0-9]/;
//   const specialCharPattern = /[!@#\$%\^\&*\)\(+=._\-\/]/;


//   if (password.length < minLength) {
//       return "Password must be at least " + minLength + " characters long.";
//   }
//   if (!upperCasePattern.test(password)) {
//       return "Password must contain at least one uppercase letter.";
//   }
//   if (!lowerCasePattern.test(password)) {
//       return "Password must contain at least one lowercase letter.";
//   }
//   if (!numberPattern.test(password)) {
//       return "Password must contain at least one number.";
//   }
//   if (!specialCharPattern.test(password)) {
//       return "Password must contain at least one special character.";
//   }

//   return "";
// }

// document.getElementById("update_user_form").addEventListener("submit", function(event) {
//   const password = document.getElementById("password").value;
//   const validationMessage = validatePassword(password);
  
//   if (validationMessage) {
//       event.preventDefault();
//       alert(validationMessage);
//   }
// });

// if(user.displayName == "Temp") {
//   first_login_modal.style.display = "block";
// };

// const ticket_table = document.getElementById("ticket_table");
// const tbody = ticket_table.querySelector("tbody");
// const rows = Array.from(tbody.querySelectorAll("tr"));
// const status_order = ['Open', 'In Progress', 'Resolved'];
// let sort_direction = {};

// function sort_table(column_index) {
//   const header = ticket_table.querySelectorAll("th")[column_index];
//   sort_direction[column_index] = !sort_direction[column_index];

//   rows.sort((a, b) => {
//     let cell_a = a.cells[column_index].innerText.toLowerCase();
//     let cell_b = b.cells[column_index].innerText.toLowerCase();

//     // Custom sorting for the "Last Changed" column
//     if (column_index === 5) {
//       const timestamp_a = b.cells[column_index].getAttribute('data-timestamp');
//       const timestamp_b = a.cells[column_index].getAttribute('data-timestamp');
//       cell_a = new Date(timestamp_a);
//       cell_b = new Date(timestamp_b);
//     }

//     // Custom sorting for the "Status" column
//     if (column_index === 6) {
//       const status_a = status_order.indexOf(a.cells[column_index].innerText);
//       const status_b = status_order.indexOf(b.cells[column_index].innerText);
//       return sort_direction[column_index] ? status_a - status_b : status_b - status_a;
//     }

//     // Numerical comparison
//     if (!isNaN(cell_a) && !isNaN(cell_b)) {
//       return sort_direction[column_index] ? cell_a - cell_b : cell_b - cell_a;
//     }

//     // Alphabetical comparison
//     return sort_direction[column_index] 
//       ? cell_a.localeCompare(cell_b) 
//       : cell_b.localeCompare(cell_a);
//   });

//   tbody.innerHTML = "";
//   rows.forEach(row => tbody.appendChild(row));
//   update_sort_arrow(header, sort_direction[column_index]);
// }

// // Update the sort arrow icon
// function update_sort_arrow(header, is_ascending) {
//   document.querySelectorAll(".arrow").forEach(arrow => {
//     arrow.innerHTML = "";
//   });
//   const arrow = header.querySelector(".arrow");
//   arrow.innerHTML = is_ascending ? "&#9650;" : "&#9660;";
// }

// sort_table(5);

// // Make "Agent" column text red if no agent is assigned
// rows.forEach(row => {
//   const agent_cell = row.getElementsByTagName("td")[3];
//   if (agent_cell.innerHTML === "None Assigned") {
//     agent_cell.style.color = "Red";
//   }
// });

// // Toggle the filter box
// document.getElementById("filter_button").addEventListener("click", function() {
//   const filter_box = document.getElementById("filter_box");
//   const filter_box_container = document.getElementById("filter_box_container");

//   if (filter_box.classList.contains("active")) {
//     filter_box.classList.remove("active");
//     filter_box.classList.add("hide");
//     filter_box_container.style.display = 'none';
//   } else {
//     filter_box_container.style.display = "block";
//     filter_box.classList.remove("hide");
//     filter_box.classList.add("active");
//   }
// });

// // Filtering functionality for category and status
// function filterTickets() {
//   const selected_categories = Array.from(document.querySelectorAll("#filter_category input[type='checkbox']:checked"))
//     .map(checkbox => checkbox.value);

//   const selected_statuses = Array.from(document.querySelectorAll("#filter_status input[type='checkbox']:checked"))
//     .map(checkbox => checkbox.value);

//   const rows = document.querySelectorAll("#ticket_table tbody tr");

//   rows.forEach(row => {
//     const category_cell = row.querySelector("td#category");
//     const category_value = category_cell ? category_cell.textContent.trim() : '';

//     const status_cell = row.querySelector("td.status");
//     const status_value = status_cell ? status_cell.textContent.trim() : '';

//     const category_matches = selected_categories.length === 0 || selected_categories.includes(category_value);
//     const status_matches = selected_statuses.length === 0 || selected_statuses.includes(status_value);

//     row.style.display = (category_matches && status_matches) ? "" : "none";
//   });
// }

// // Event listeners for category and status filtering
// document.querySelectorAll("#filter_category input[type='checkbox']").forEach(checkbox => {
//   checkbox.addEventListener("change", filterTickets);
// });

// document.querySelectorAll("#filter_status input[type='checkbox']").forEach(checkbox => {
//   checkbox.addEventListener("change", filterTickets);
// });
