const contactContainer = document.getElementById("contacts");
const detailsContainer = document.getElementById("contact-details");
const addContactButton = document.getElementById("add-contact-button");
const contactForm = document.getElementById("contact-form");
const cancelButton = document.getElementById("cancel-button");
let editingContactId = null;

addContactButton.addEventListener("click", () => {
    editingContactId = null;
    showContactForm();
});

cancelButton.addEventListener("click", () => {
    hideContactForm();
});

contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);

    const contact = {
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        emails: [{
            address: formData.get("email")
        }]
    };

    const url = editingContactId ? `/api/contacts/${editingContactId}/` : "/api/contacts/";
    fetch(url, {
        method: editingContactId ? "PUT" : "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(contact)
    }).then(response => response.json()).then(data => {
        hideContactForm();
        displayContact(data);
    });
});

fetch("/api/contacts/").then(response => response.json())
    .then(contacts => {
        contacts.forEach(contact => {
            displayContact(contact);
        });
    });

function showContactForm(contact) {
    contactForm.hidden = false;

    if (contact) {
        editingContactId = contact.id;

        document.getElementById("first-name").value = contact.first_name;
        document.getElementById("last-name").value = contact.last_name;

        if (contact.emails.length > 0) {
            document.getElementById("email").value = contact.emails[0].address;
        }
    }
}

function hideContactForm() {
    contactForm.hidden = true;
    contactForm.reset();
}

function displayContact(contact) {
    let element = contactContainer.querySelector(`[data-contact-id="${contact.id}"]`);
    if (!element) {
        element = document.createElement("div");
        element.dataset.contactId = contact.id;
        contactContainer.appendChild(element);
    }

    element.replaceChildren();

    const nameElement = document.createElement("span");
    nameElement.textContent = `${contact.first_name} ${contact.last_name}`;
    element.appendChild(nameElement);

    const viewButton = document.createElement("button");
    viewButton.textContent = "View";
    viewButton.addEventListener("click", () => {
        displayContactDetails(contact);
    });
    element.appendChild(viewButton);

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
        showContactForm(contact);
    });
    element.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
        fetch(`/api/contacts/${contact.id}/`, {
            method: "DELETE"
        }).then(() => {
            element.remove();
        });
    });
    element.appendChild(deleteButton);
}

function displayContactDetails(contact) {
    detailsContainer.textContent = `${contact.first_name} ${contact.last_name}`;

    if (contact.emails.length > 0) {
        contact.emails.forEach(email => {
            const emailElement = document.createElement("div");
            emailElement.textContent = email.address;
            detailsContainer.appendChild(emailElement);
        });
    } else {
        const emailElement = document.createElement("div");
        emailElement.textContent = "No email addresses";
        detailsContainer.appendChild(emailElement);
    }
}