// DOM elements
const contactContainer = document.getElementById("contacts");

const searchContacts = document.getElementById("search-contacts");
const sortField = document.getElementById("sort-field");
const sortOrder = document.getElementById("sort-order");
const addContactButton = document.getElementById("add-contact-button");
const contactsEmptyMessage = document.getElementById("contacts-empty-message");
const contactsCount = document.getElementById("contacts-count");

const contactForm = document.getElementById("contact-form");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const addEmailButton = document.getElementById("add-email-button");
const emailFields = document.getElementById("email-fields");
const deleteContactButton = document.getElementById("delete-contact-button");

const firstNameError = document.getElementById("first-name-error");
const lastNameError = document.getElementById("last-name-error");
const emailError = document.getElementById("email-error");
const emailDuplicate = document.getElementById("email-duplicate");

const deleteDialog = document.getElementById("delete-dialog");
const confirmDeleteButton = document.getElementById("confirm-delete-button");
const cancelDeleteButton = document.getElementById("cancel-delete-button");

const discardDialog = document.getElementById("discard-dialog");
const confirmDiscardButton = document.getElementById("confirm-discard-button");
const cancelDiscardButton = document.getElementById("cancel-discard-button");

// State variables
let editingContactId = null;
let currentContact = null;
let unsavedChanges = false;
let pendingAction = null;

/**
 * Submits the contact form to the API.
 */
function submitContactForm() {
    const contact = buildContactFromForm();

    clearErrors();
    if (!validateContact(contact)) return;

    const url = "/api/contacts/" + (editingContactId ? `${editingContactId}/` : "");
    fetch(url, {
        method: editingContactId ? "PUT" : "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(contact)
    }).then(response => {
        return response.json().then(data => {
            handleContactEditResponse(response, data);
        });
    });
}

/**
 * Builds a contact structure from the content of the form.
 * 
 * @returns {Object} the contact represented by the form
 */
function buildContactFromForm() {
    const formData = new FormData(contactForm);
    return {
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
}

/**
 * Handles the response from adding/updating a contact.
 * 
 * @param {Response} response the API response
 * @param {Object} data the response data
 */
function handleContactEditResponse(response, data) {
    if (!response.ok) {
        displayContactErrors(data);
        return;
    }

    displayContact(data);
    showContactForm(data);
    sortContactsList();
    updateCountMessage();
}

/**
 * Displays validation errors returned by an API call.
 * 
 * @param {Object} data the API error data
 */
function displayContactErrors(data) {
    if (data.first_name) {
        firstNameError.hidden = false;
    }

    if (data.last_name) {
        lastNameError.hidden = false;
    }

    if (data.emails) {
        const emailElements = emailFields.querySelectorAll(".email");
        for (let [index, errors] of Object.entries(data.emails)) {
            const emailElement = emailElements[index];
            if (!emailElement) continue;
            
            const errorElement = emailElement.querySelector(".email-error");
            if (errors.address) {
                errorElement.textContent = errors.address[0];
                errorElement.hidden = false;
            }
        }
    }
}

/**
 * Shows the contact form, optionally pre-filling it with an existing contact.
 * 
 * @param {Object} contact the selected contact, or null if we are creating a new contact
 */
function showContactForm(contact = null) {
    currentContact = contact;
    editingContactId = contact ? contact.id : null;
    contactContainer.querySelectorAll(".contact button").forEach(button => {
        button.classList.remove("selected-contact");
    });
    if (contact) {
        contactContainer.querySelector(`[data-contact-id="${contact.id}"] button`)
            .classList.add("selected-contact");
    }

    clearErrors();
    setUnsavedChanges(false);
    contactForm.hidden = false;

    if (contact) {
        deleteContactButton.classList.remove("hidden-button");

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
        deleteContactButton.classList.add("hidden-button");
        contactForm.reset();
        emailFields.replaceChildren();
        addEmailField();
    }
}

/**
 * Hides and clears the contact form.
 */
function hideContactForm() {
    contactContainer.querySelectorAll(".contact button").forEach(button => {
        button.classList.remove("selected-contact");
    });
    contactForm.hidden = true;
    contactForm.reset();
    setUnsavedChanges(false);
}

/**
 * Displays a contact in the contact list.
 * 
 * @param {Object} contact the contact to display
 */
function displayContact(contact) {
    let contactElement = contactContainer.querySelector(`[data-contact-id="${contact.id}"]`);
    if (!contactElement) {
        contactElement = document.createElement("div");
        contactElement.classList.add("contact");
        contactElement.dataset.contactId = contact.id;
        contactContainer.appendChild(contactElement);
    }

    contactElement.dataset.firstName = contact.first_name;
    contactElement.dataset.lastName = contact.last_name;
    contactElement.dataset.searchText = [
        contact.first_name,
        contact.last_name,
        ...contact.emails.map(email => email.address)
    ].join(" ").toLowerCase();
    contactElement.replaceChildren();

    const nameElement = document.createElement("button");
    nameElement.textContent = `${contact.first_name} ${contact.last_name}`;
    nameElement.addEventListener("click", () => {
        confirmDiscardChanges(() => {
            showContactForm(contact);
        });
    });
    contactElement.appendChild(nameElement);
}

/**
 * Adds an email field to the form, optionally pre-filled.
 * 
 * @param {string} emailAddress an existing email address, or null to create an empty field
 */
function addEmailField(emailAddress = null) {
    const emailElement = document.createElement("div");
    emailElement.classList.add("email");

    const newEmail = document.createElement("input");
    emailElement.appendChild(newEmail);

    const errorElement = document.createElement("div");
    errorElement.classList.add("email-error");
    errorElement.hidden = true;
    emailElement.appendChild(errorElement);

    if (emailAddress) {
        newEmail.value = emailAddress;
        newEmail.classList.add("saved-email");
        newEmail.addEventListener("input", () => {
            newEmail.classList.remove("saved-email");
        });
    } else {
        newEmail.name = "email";
        newEmail.type = "email";
        newEmail.placeholder = "Enter email address";
    }

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "-";
    removeButton.classList.add("delete-email-button");
    removeButton.setAttribute("aria-label", "Delete email");
    removeButton.addEventListener("mousedown", (event) => {
        event.preventDefault();
    });
    removeButton.addEventListener("click", () => {
        if (emailFields.querySelectorAll('.email').length > 1) {
            emailElement.remove();
        } else {
            emailError.hidden = false;
        }
        setUnsavedChanges(true);
    });
    emailElement.appendChild(removeButton);

    emailFields.appendChild(emailElement);
    return newEmail;
}

/**
 * Clears all error messages from the page.
 */
function clearErrors() {
    firstNameError.hidden = true;
    lastNameError.hidden = true;
    emailError.hidden = true;
    emailDuplicate.hidden = true;

    emailFields.querySelectorAll(".email-error").forEach(errorElement => {
        errorElement.hidden = true;
        errorElement.textContent = "";
    });
}

/**
 * Checks if the contact's data is valid. Displays appropriate error messages.
 * 
 * @param {Object} contact the contact to validate
 * @returns {boolean} whether the contact is valid
 */
function validateContact(contact) {
    let isValid = true;
    if (contact.first_name.length === 0) {
        firstNameError.hidden = false;
        isValid = false;
    }
    if (contact.last_name.length === 0) {
        lastNameError.hidden = false;
        isValid = false;
    }
    if (contact.emails.length === 0) {
        emailError.hidden = false;
        isValid = false;
    }
    
    const emailSet = new Set(contact.emails.map(email => email.address.trim().toLowerCase()));
    if (emailSet.size !== contact.emails.length) {
        emailDuplicate.hidden = false;
        isValid = false;
    }

    return isValid;
}

/**
 * Deletes the contact we are currently editing.
 */
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
        updateCountMessage();
    });
}

/**
 * Either executes the action if no changes have been made, or queues it and displays
 * a confirmation dialog.
 * 
 * @param {function(): void} action the action to be executed or queued
 */
function confirmDiscardChanges(action) {
    if (!unsavedChanges) {
        action();
        return;
    }

    pendingAction = action;
    discardDialog.showModal();
}

/**
 * Sets whether the form has unsaved changes and updates the form buttons.
 * 
 * @param {boolean} value whether there are unsaved changes
 */
function setUnsavedChanges(value) {
    unsavedChanges = value;
    saveButton.hidden = !value;
    cancelButton.textContent = value || !editingContactId ? "Cancel" : "Close";
}

/**
 * Filters the contact list based on the search field.
 */
function searchContactsList() {
    const searchText = searchContacts.value.trim().toLowerCase();

    let shown = 0;
    contactContainer.querySelectorAll(".contact").forEach(contact => {
        contact.hidden = !contact.dataset.searchText.includes(searchText);
        if (!contact.hidden) shown++;
    });
    updateCountMessage();
}

/**
 * Sorts the contact list based on the selected field and order.
 */
function sortContactsList() {
    const contacts = [...contactContainer.querySelectorAll(".contact")];
    const field = sortField.value;
    const order = sortOrder.value;

    contacts.sort((a, b) => {
        const comparison = a.dataset[field].localeCompare(b.dataset[field]);
        return order === "asc" ? comparison : -comparison;
    });

    contacts.forEach(contact => {
        contactContainer.appendChild(contact);
    });
}

/**
 * Shows the appropriate contacts count message.
 */
function updateCountMessage() {
    const contacts = [...contactContainer.querySelectorAll(".contact")];
    const shown = contacts ? contacts.filter(contact => {
        return !contact.hidden;
    }).length : 0;
    const total = contacts ? contacts.length : 0;

    if (shown < total) {
        contactsCount.textContent = `Showing ${shown} contact${shown !== 1 ? 's' : ''} of ${total}.`;
    } else {
        contactsCount.textContent = `Showing ${total} contact${total !== 1 ? 's' : ''}.`;
    }

    contactsEmptyMessage.hidden = !(contacts.length === 0);
    contactsCount.hidden = contacts.length === 0;
}