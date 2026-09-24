// Event listeners
addContactButton.addEventListener("click", () => {
    confirmDiscardChanges(() => {
        editingContactId = null;
        showContactForm(null);
    });
});

searchContacts.addEventListener("input", () => {
    searchContactsList();
});

sortField.addEventListener("change", () => {
    sortContactsList();
});

sortOrder.addEventListener("change", () => {
    sortContactsList();
});

cancelButton.addEventListener("click", () => {
    if (unsavedChanges && editingContactId) {
        showContactForm(currentContact);
    } else {
        hideContactForm();
    }
});

addEmailButton.addEventListener("click", () => {
    setUnsavedChanges(true);
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

confirmDiscardButton.addEventListener("click", () => {
    setUnsavedChanges(false);
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

contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitContactForm();
});

contactForm.addEventListener("input", () => {
    setUnsavedChanges(true);
});

// Initialization
fetch("/api/contacts/").then(response => response.json()).then(contacts => {
    contacts.forEach(contact => {
        displayContact(contact);
    });
    sortContactsList();
});