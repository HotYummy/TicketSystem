const modal = document.getElementById("my_modal");
const email_input = document.getElementsByClassName("email");
const name_input = document.getElementById("name");

// Function to open modal
function openUserCreationMenu(email) {
    modal.style.display = "flex";
    email_input[0].value = email;
    email_input[1].value = email;
}

const category_modal = document.getElementById("category_modal");
const confirmation = document.getElementById("confirmation");
const category_table = document.getElementsByClassName("block_table")[1];
const category_table_rows = Array.from(category_table.rows);
category_table_rows.shift();
let index_to_delete;

function openCategoryDeletionMenu(i) {
    category_modal.style.display = "flex";
    confirmation.innerText = "Are you sure you want to delete the category: " + categories[i].name + "?";
    index_to_delete = i;
}

function closeCategoryModal() {
    category_modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    } else if (event.target === category_modal) {
        category_modal.style.display = "none";
    }
};


document.getElementById("accept_user_creation_form").onsubmit = function() {
    email_input[0].disabled = false;
    name_input.disabled = false;
}

const info_containers = document.getElementsByClassName("info_container");
const nav_buttons = document.getElementsByClassName("agent_nav_button");
let current_view = localStorage.getItem('current_view') !== null ? parseInt(localStorage.getItem('current_view'), 10) : 0;

nav_buttons[current_view].classList.add("active");

function changeView(i) {
    for (let j = 0; j < info_containers.length; j++) {
        info_containers[j].style.display = "none";
    }

    document.getElementById("dashboard_container").style.display = "none";

    if (i === 0) {
        document.getElementById("dashboard_container").style.display = "flex";
    } else {
        info_containers[i - 1].style.display = "flex";
    }

    nav_buttons[current_view].classList.remove("active");
    nav_buttons[i].classList.add("active");
    
    current_view = i;
    localStorage.setItem('current_view', current_view);
}

changeView(current_view)

function deleteCategory() {
    fetch(`/agentPanel/deleteCategory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: category_table_rows[index_to_delete].cells[0].innerText })
    })
    .then(() => {
        console.log('Request sent successfully');
    })
    .catch(error => {
        console.error('Error:', error);
    });

    location.reload();
}

let notif = false;
let i = 0;

while (notif === false && i < tickets.length) {
    if (tickets[i].unread_agent && tickets[i].agent_name === user.displayName) {
        notif = true;
    }
    i++;
}

if (notif === true) {
    document.getElementsByClassName("sidebar_button")[0].innerHTML += '<span class="material-symbols-outlined">notifications</span>';
}

function saveOrder() {
    const order = [];
    const boxes = document.querySelectorAll('.info_box_container');

    boxes.forEach(box => {
        order.push(box.id);
    });

    localStorage.setItem('dashboard_order', JSON.stringify(order));
}

function loadOrder() {
    const savedOrder = JSON.parse(localStorage.getItem('dashboard_order'));
    const container = document.getElementById('dashboard_container');

    if (savedOrder) {
        savedOrder.forEach(id => {
            const box = document.getElementById(id);
            container.appendChild(box);
        });
    }
}

const dashboard_container = document.getElementById('dashboard_container');
Sortable.create(dashboard_container, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    handle: '.info_box',
    swapThreshold: 0.5,
    onEnd: function() {
        saveOrder();
    }
});

window.addEventListener('load', loadOrder);

if(role == "Super Admin" && update_tickets.length > 0){
    document.getElementsByClassName("sidebar_button")[2].innerHTML += `<div id="update_amount">(${update_tickets.length})</div>`
}