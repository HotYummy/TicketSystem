const modal = document.getElementById("my_modal");
const new_post_button = document.getElementById("new_post");

// Open the modal when the new post button is clicked
new_post_button.onclick = function() {
  modal.style.display = "block";
};

const post_modal = document.getElementById("post_modal");
const comment_container = document.getElementById("comment_container");

function open_post(id) {
  post_modal.style.display = "flex";
  comment_container.innerText = posts[id].content;
}

// Single event listener to handle clicks outside both modals
window.onclick = function(event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
  if (event.target === post_modal) {
    post_modal.style.display = "none";
  }
};


// Search functionality for the searchbar
document.getElementById('searchbar').addEventListener('input', function() {
  const search_query = this.value.toLowerCase();
  const rows = document.querySelectorAll('#post_table tbody tr');

  // First, filter the posts based on current filters
  filterposts();

  rows.forEach(row => {
    // Check if the row is visible after filtering
    if (row.style.display !== 'none') {
      const cells = row.querySelectorAll('td');
      const row_contains_query = Array.from(cells).some(cell =>
        cell.textContent.toLowerCase().includes(search_query)
      );
      row.style.display = row_contains_query ? '' : 'none';
    }
  });
});

// if(user.displayName == "Temp") {
//   window.location = "/dashboard";
// };

const post_table = document.getElementById("post_table");
const tbody = post_table.querySelector("tbody");
const rows = Array.from(tbody.querySelectorAll("tr"));
let sort_direction = {};

function sort_table(column_index) {
  const header = post_table.querySelectorAll("th")[column_index];
  sort_direction[column_index] = !sort_direction[column_index];

  rows.sort((a, b) => {
    let cell_a = a.cells[column_index].innerText.toLowerCase();
    let cell_b = b.cells[column_index].innerText.toLowerCase();

    // Numerical comparison
    if (!isNaN(cell_a) && !isNaN(cell_b)) {
      return sort_direction[column_index] ? cell_a - cell_b : cell_b - cell_a;
    }

    // Alphabetical comparison
    return sort_direction[column_index] 
      ? cell_a.localeCompare(cell_b) 
      : cell_b.localeCompare(cell_a);
  });

  tbody.innerHTML = "";
  rows.forEach(row => tbody.appendChild(row));
  update_sort_arrow(header, sort_direction[column_index]);
}

// Update the sort arrow icon
function update_sort_arrow(header, is_ascending) {
  document.querySelectorAll(".arrow").forEach(arrow => {
    arrow.innerHTML = "";
  });
  const arrow = header.querySelector(".arrow");
  arrow.innerHTML = is_ascending ? "&#9650;" : "&#9660;";
}

// // Make "Agent" column text red if no agent is assigned
// rows.forEach(row => {
//   const agent_cell = row.getElementsByTagName("td")[3];
//   if (agent_cell.innerHTML === "None Assigned") {
//     agent_cell.style.color = "Red";
//   }
// });

// Toggle the filter box
document.getElementById("filter_button").addEventListener("click", function() {
  const filter_box = document.getElementById("filter_box");
  const filter_box_container = document.getElementById("filter_box_container");

  if (filter_box.classList.contains("active")) {
    filter_box.classList.remove("active");
    filter_box.classList.add("hide");
    filter_box_container.style.display = 'none';
  } else {
    filter_box_container.style.display = "block";
    filter_box.classList.remove("hide");
    filter_box.classList.add("active");
  }
});

// Filtering functionality for category and status
function filterposts() {
  const selected_categories = Array.from(document.querySelectorAll("#filter_category input[type='checkbox']:checked"))
    .map(checkbox => checkbox.value);

  const selected_statuses = Array.from(document.querySelectorAll("#filter_status input[type='checkbox']:checked"))
    .map(checkbox => checkbox.value);

  const rows = document.querySelectorAll("#post_table tbody tr");

  rows.forEach(row => {
    const category_cell = row.querySelector("td#category");
    const category_value = category_cell ? category_cell.textContent.trim() : '';

    const status_cell = row.querySelector("td.status");
    const status_value = status_cell ? status_cell.textContent.trim() : '';

    const category_matches = selected_categories.length === 0 || selected_categories.includes(category_value);
    const status_matches = selected_statuses.length === 0 || selected_statuses.includes(status_value);

    row.style.display = (category_matches && status_matches) ? "" : "none";
  });
}

// Event listeners for category and status filtering
document.querySelectorAll("#filter_category input[type='checkbox']").forEach(checkbox => {
  checkbox.addEventListener("change", filterposts);
});

document.querySelectorAll("#filter_status input[type='checkbox']").forEach(checkbox => {
  checkbox.addEventListener("change", filterposts);
});

let notif = false;
let i = 0;

while(notif == false && i < tickets.length){
  if(tickets[i].unread_agent && tickets[i].agent_name == user.displayName){
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