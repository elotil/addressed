const contactContainer = document.getElementById("contacts");
const detailsContainer = document.getElementById("contact-details");
const addContactButton = document.getElementById("add-contact-button");
const contactForm = document.getElementById("contact-form");
const cancelButton = document.getElementById("cancel-button");
const addEmailButton = document.getElementById("add-email-button");
const emailFields = document.getElementById("email-fields");
const deleteContactButton = document.getElementById("delete-contact-button");
const deleteDialog = document.getElementById("delete-dialog");
const confirmDeleteButton = document.getElementById("confirm-delete-button");
const cancelDeleteButton = document.getElementById("cancel-delete-button");
const discardDialog = document.getElementById("discard-dialog");
const confirmDiscardButton = document.getElementById("confirm-discard-button");
const cancelDiscardButton = document.getElementById("cancel-discard-button");
let editingContactId = null;
let currentContact = null;
let unsavedChanges = false;
let pendingAction = null;

addContactButton.addEventListener("click", () => {
    confirmDiscardChanges(() => {
        editingContactId = null;
        showContactForm();
    });
});

cancelButton.addEventListener("click", () => {
    if (editingContactId) {
        showContactForm(currentContact);
    } else {
        hideContactForm();
    }
});

addEmailButton.addEventListener("click", () => {
    unsavedChanges = true;
    addEmailField().focus();
});

deleteContactButton.addEventListener("click", () => {
    deleteDialog.showModal();
});

confirmDeleteButton.addEventListener("click", () => {
    deleteContact();
});

cancelDeleteButton.addEventListener("click", () => {
    deleteDialog.close();
});

contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitContactForm();
});

confirmDiscardButton.addEventListener("click", () => {
    unsavedChanges = false;
    discardDialog.close();

    if (pendingAction) {
        pendingAction();
        pendingAction = null;
    }
});

cancelDiscardButton.addEventListener("click", () => {
    discardDialog.close();
    pendingAction = null;
});

fetch("/api/contacts/").then(response => response.json()).then(contacts => {
    contacts.forEach(contact => {
        displayContact(contact);
    });
});

function submitContactForm() {
    const formData = new FormData(contactForm);
    const contact = {
        first_name: formData.get("first_name").trim(),
        last_name: formData.get("last_name").trim(),
        emails: Array.from(emailFields.querySelectorAll(".email"))
        .map(emailElement => {
            const email = emailElement.querySelector("input, span");
            const value = email.value ?? email.textContent;
            return { address : value.trim() };
        })
        .filter(email => email.address.length > 0)
    };

    clearErrors();
    if (!validateContact(contact)) return;

    const url = editingContactId ? `/api/contacts/${editingContactId}/` : "/api/contacts/";
    fetch(url, {
        method: editingContactId ? "PUT" : "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(contact)
    }).then(response => {
        return response.json().then(data => {
            if (!response.ok) {
                if (data.first_name) {
                    document.getElementById("first-name-error").hidden = false;
                }
                if (data.last_name) {
                    document.getElementById("last-name-error").hidden = false;
                }
                if (data.emails) {
                    let emailElements = emailFields.querySelectorAll(".email");
                    for (let [index, errors] of Object.entries(data.emails)) {
                        let errorElement = emailElements[index].querySelector(".email-error");
                        if (errors.address) {
                            errorElement.textContent = errors.address[0];
                            errorElement.hidden = false;
                        }
                    }
                }
                return;
            }

            showContactForm(data);
            displayContact(data);
        });
    });
}

function showContactForm(contact) {
    currentContact = contact;
    contactContainer.querySelectorAll(".contact button").forEach(button => {
        button.classList.remove("selected-contact");
    });
    if (contact) {
        contactContainer.querySelector(`[data-contact-id="${contact.id}"] button`)
            .classList.add("selected-contact");
    }

    contactForm.hidden = false;
    clearErrors();
    unsavedChanges = false;
    contactForm.addEventListener("input", () => {
        unsavedChanges = true;
    });

    if (contact) {
        editingContactId = contact.id;

        document.getElementById("first-name").value = contact.first_name;
        document.getElementById("last-name").value = contact.last_name;

        if (contact.emails.length > 0) {
            emailFields.replaceChildren();
            for (const email of contact.emails) {
                addEmailField(email.address);
            }
        } else {
            emailFields.replaceChildren();
            addEmailField();
        }
    } else {
        contactForm.reset();
        emailFields.replaceChildren();
        addEmailField();
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
        element.classList.add("contact");
        element.dataset.contactId = contact.id;
        contactContainer.appendChild(element);
    }

    element.replaceChildren();

    const nameElement = document.createElement("button");
    nameElement.textContent = `${contact.first_name} ${contact.last_name}`;
    nameElement.addEventListener("click", () => {
        confirmDiscardChanges(() => {
            showContactForm(contact);
        });
    });
    element.appendChild(nameElement);
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

function addEmailField(text) {
    let emailElement = document.createElement("div");
    emailElement.classList.add("email");

    let newEmail = document.createElement("input");
    emailElement.appendChild(newEmail);

    let errorElement = document.createElement("div");
    errorElement.classList.add("email-error");
    errorElement.hidden = true;
    emailElement.appendChild(errorElement);

    if (text) {
        newEmail.value = text;
        newEmail.classList.add("saved-email");
        newEmail.addEventListener("input", () => {
            newEmail.classList.remove("saved-email");
        });
    } else {
        newEmail.name = "email";
        newEmail.type = "email";
        newEmail.placeholder = "Enter email address";
    }

    let removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "-";
    removeButton.classList.add("delete-email-button");
    removeButton.addEventListener("mousedown", (event) => {event.preventDefault();});
    removeButton.addEventListener("click", () => {
        if (emailFields.querySelectorAll('.email').length > 1) {
            emailElement.remove();
        } else {
            document.getElementById("email-error").hidden = false;
        }
        unsavedChanges = true;
    });
    emailElement.appendChild(removeButton);

    emailFields.appendChild(emailElement);
    return newEmail;
}

function clearErrors() {
    document.getElementById("first-name-error").hidden = true;
    document.getElementById("last-name-error").hidden = true;
    document.getElementById("email-error").hidden = true;
    document.getElementById("email-server-error").hidden = true;
}

function validateContact(contact) {
    let isValid = true;
    if (contact.first_name.length === 0) {
        document.getElementById("first-name-error").hidden = false;
        isValid = false;
    }
    if (contact.last_name.length === 0) {
        document.getElementById("last-name-error").hidden = false;
        isValid = false;
    }
    if (contact.emails.length === 0) {
        document.getElementById("email-error").hidden = false;
        isValid = false;
    }
    return isValid;
}

function editEmail(emailText, event) {
    let emailInput = document.createElement("input");
    emailInput.type = "text";
    emailInput.name = "email";
    emailInput.value = emailText.textContent;

    let textWidth = emailText.getBoundingClientRect().width;
    let clickPosition = event.clientX - emailText.getBoundingClientRect().left;
    let ratio = clickPosition / textWidth;
    let cursorPosition = Math.round(ratio * emailInput.value.length);

    emailText.replaceWith(emailInput);
    emailInput.focus();
    emailInput.setSelectionRange(cursorPosition, cursorPosition);
    emailInput.type = "email";

    emailInput.addEventListener("blur", () => {
        replaceEmailInput(emailInput);
    });
}

function replaceEmailInput(emailInput) {
    if (emailInput.value.trim() === "") {
        emailInput.placeholder = "Enter email address";
        return;
    }

    let newEmailText = document.createElement("span");
    newEmailText.textContent = emailInput.value;
    newEmailText.addEventListener("click", (event) => {
        editEmail(newEmailText, event);
    });
    emailInput.replaceWith(newEmailText);
}

function deleteContact() {
    fetch(`/api/contacts/${editingContactId}/`, {
        method: "DELETE"
    }).then(response => {
        if (!response.ok) return;

        contactContainer
            .querySelector(`[data-contact-id="${editingContactId}"]`)
            .remove();

        editingContactId = null;
        currentContact = null;
        hideContactForm();
        deleteDialog.close();
    });
}

function confirmDiscardChanges(action) {
    if (!unsavedChanges) {
        action();
        return;
    }

    pendingAction = action;
    discardDialog.showModal();
}