
"use strict";

// Browser-local storage for educational demo records.
const STORAGE_KEY = "demoDonors";

const allowedBloodGroups = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

const donorForm = document.getElementById("donorForm");
const searchForm = document.getElementById("searchForm");
const results = document.getElementById("results");
const message = document.getElementById("message");
const adminMessage = document.getElementById("adminMessage");

const clearSearchButton = document.getElementById("clearSearch");
const clearAllDonorsButton = document.getElementById("clearAllDonors");

// Read records from localStorage.
function getDonors() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const donors = JSON.parse(savedData);

        if (!Array.isArray(donors)) {
            return [];
        }

        return donors;
    } catch (error) {
        console.error("Error reading demo records:", error);
        return [];
    }
}

// Save records to localStorage.
function saveDonors(donors) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
        return true;
    } catch (error) {
        console.error("Error saving demo records:", error);
        return false;
    }
}

// Display a status message.
function showMessage(element, text, type = "") {
    element.textContent = text;
    element.className = "message";

    if (type) {
        element.classList.add(type);
    }
}

// Update the statistics.
function updateStats() {
    const donors = getDonors();

    const uniqueGroups = new Set(
        donors.map(donor => donor.bloodGroup)
    );

    document.getElementById("totalDonors").textContent =
        donors.length;

    document.getElementById("bloodGroupsCount").textContent =
        uniqueGroups.size;
}

// Normalize text for case-insensitive comparison.
function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

// Normalize phone formatting for duplicate checks.
// This is a format check, not verification of a real phone number.
function normalizePhone(phone) {
    return String(phone || "").replace(/[\s\-()+]/g, "");
}

function isValidPhone(phone) {
    const cleaned = normalizePhone(phone);
    return /^\d{10,15}$/.test(cleaned);
}

// Create text elements safely.
function createTextElement(tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}

// Register a demo donor.
donorForm.addEventListener("submit", function (event) {
    event.preventDefault();
    showMessage(message, "");

    const name = document.getElementById("name").value.trim();
    const bloodGroup = document.getElementById("bloodGroup").value;
    const age = Number(document.getElementById("age").value);
    const city = document.getElementById("city").value.trim();
    const area = document.getElementById("area").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const consent = document.getElementById("consent").checked;

    if (!name || !bloodGroup || !city || !area || !phone) {
        showMessage(
            message,
            "Please fill in all the fields.",
            "error"
        );
        return;
    }

    if (!allowedBloodGroups.includes(bloodGroup)) {
        showMessage(
            message,
            "Please select a valid blood group.",
            "error"
        );
        return;
    }

    if (!Number.isInteger(age) || age < 18 || age > 100) {
        showMessage(
            message,
            "For this demo, enter an age from 18 to 100.",
            "error"
        );
        return;
    }

    if (!isValidPhone(phone)) {
        showMessage(
            message,
            "Enter 10 to 15 digits for the demo contact number.",
            "error"
        );
        return;
    }

    if (!consent) {
        showMessage(
            message,
            "Please confirm that you are using fictional test data.",
            "error"
        );
        return;
    }

    const donors = getDonors();
    const phoneToCheck = normalizePhone(phone);

    // Prevent duplicate registrations with the same demo number.
    const duplicateExists = donors.some(function (donor) {
        return normalizePhone(donor.phone) === phoneToCheck;
    });

    if (duplicateExists) {
        showMessage(
            message,
            "This demo contact number is already registered.",
            "error"
        );
        return;
    }

    const donor = {
        id: (window.crypto &&
             typeof window.crypto.randomUUID === "function")
            ? window.crypto.randomUUID()
            : String(Date.now()) + Math.random().toString(16).slice(2),
        name: name,
        bloodGroup: bloodGroup,
        age: age,
        city: city,
        area: area,
        phone: phone
    };

    donors.push(donor);

    if (!saveDonors(donors)) {
        showMessage(
            message,
            "Could not save the record. Check your browser storage settings.",
            "error"
        );
        return;
    }

    updateStats();
    donorForm.reset();

    showMessage(
        message,
        "Demo donor registered successfully!",
        "success"
    );
});

// Search by exact blood group and city.
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    results.replaceChildren();

    const searchGroup =
        document.getElementById("searchGroup").value;

    const searchCity = normalizeText(
        document.getElementById("searchCity").value
    );

    if (!allowedBloodGroups.includes(searchGroup) || !searchCity) {
        results.appendChild(
            createTextElement(
                "p",
                "Please select a blood group and enter a city.",
                "empty-message"
            )
        );
        return;
    }

    const matchingDonors = getDonors().filter(function (donor) {
        return donor.bloodGroup === searchGroup &&
            normalizeText(donor.city) === searchCity;
    });

    if (matchingDonors.length === 0) {
        results.appendChild(
            createTextElement(
                "p",
                "No matching demo records found. Try another blood group or city.",
                "empty-message"
            )
        );
        return;
    }

    matchingDonors.forEach(function (donor) {
        const card = document.createElement("article");
        card.className = "donor-card";

        card.appendChild(
            createTextElement("h3", donor.name)
        );

        card.appendChild(
            createTextElement(
                "span",
                donor.bloodGroup,
                "blood-badge"
            )
        );

        card.appendChild(
            createTextElement("p", "City: " + donor.city)
        );

        card.appendChild(
            createTextElement("p", "Area: " + donor.area)
        );

        card.appendChild(
            createTextElement("p", "Age: " + donor.age)
        );

        // The phone number is not displayed in search results.
        const requestButton = createTextElement(
            "button",
            "Request Contact (Demo)",
            "btn-submit"
        );

        requestButton.type = "button";

        requestButton.addEventListener("click", function () {
            alert(
                "Demo only: no contact request has been sent. " +
                "A real service would require secure, consent-based contact."
            );
        });

        card.appendChild(requestButton);
        results.appendChild(card);
    });
});

// Clear search inputs and results.
clearSearchButton.addEventListener("click", function () {
    searchForm.reset();
    results.replaceChildren();
});

// Delete all demo records saved in this browser.
clearAllDonorsButton.addEventListener("click", function () {
    const donors = getDonors();

    if (donors.length === 0) {
        showMessage(
            adminMessage,
            "There are no demo records to delete."
        );
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete all demo records saved in this browser?"
    );

    if (!confirmed) {
        showMessage(adminMessage, "Deletion cancelled.");
        return;
    }

    try {
        localStorage.removeItem(STORAGE_KEY);

        updateStats();
        results.replaceChildren();

        showMessage(
            adminMessage,
            "All demo records have been deleted.",
            "success"
        );

        showMessage(message, "");
    } catch (error) {
        console.error("Error deleting demo records:", error);

        showMessage(
            adminMessage,
            "Could not delete the records. Please check browser settings.",
            "error"
        );
    }
});

// Initialize the statistics when the page loads.
updateStats();
