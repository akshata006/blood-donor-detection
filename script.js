
"use strict";

// Browser-local storage for this educational project.
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

// Read saved donor records.
function getDonors() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) return [];

        const donors = JSON.parse(savedData);

        return Array.isArray(donors) ? donors : [];
    } catch (error) {
        console.error("Error reading donor records:", error);
        return [];
    }
}

// Save donor records.
function saveDonors(donors) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
        return true;
    } catch (error) {
        console.error("Error saving donor records:", error);
        return false;
    }
}

// Display status messages safely.
function showMessage(element, text, type = "") {
    if (!element) return;

    element.textContent = text;
    element.className = "message";

    if (type) element.classList.add(type);
}

// Update dashboard statistics.
function updateStats() {
    const donors = getDonors();

    const totalDonors = document.getElementById("totalDonors");
    const groupsCount = document.getElementById("bloodGroupsCount");

    if (totalDonors) totalDonors.textContent = donors.length;

    if (groupsCount) {
        groupsCount.textContent =
            new Set(donors.map(donor => donor.bloodGroup)).size;
    }
}

// Normalize text for searching.
function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

// Remove phone formatting characters.
function normalizePhone(phone) {
    return String(phone || "").replace(/[^\d+]/g, "");
}

// Basic phone number format validation.
function isValidPhone(phone) {
    const cleaned = normalizePhone(phone).replace(/\D/g, "");
    return /^\d{10,15}$/.test(cleaned);
}

// Create text elements safely.
function createTextElement(tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = String(text ?? "");

    if (className) element.className = className;

    return element;
}

// Register a donor.
if (donorForm) {
    donorForm.addEventListener("submit", function (event) {
        event.preventDefault();
        showMessage(message, "");

        const name = document.getElementById("name").value.trim();
        const bloodGroup =
            document.getElementById("bloodGroup").value;
        const age = Number(document.getElementById("age").value);
        const city = document.getElementById("city").value.trim();
        const area = document.getElementById("area").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const consent = document.getElementById("consent").checked;

        if (!name || !bloodGroup || !city || !area || !phone) {
            showMessage(message, "Please fill in all fields.", "error");
            return;
        }

        if (!allowedBloodGroups.includes(bloodGroup)) {
            showMessage(message, "Select a valid blood group.", "error");
            return;
        }

        if (!Number.isInteger(age) || age < 18 || age > 100) {
            showMessage(
                message,
                "For this project, enter an age from 18 to 100.",
                "error"
            );
            return;
        }

        if (!isValidPhone(phone)) {
            showMessage(
                message,
                "Enter a phone number containing 10 to 15 digits.",
                "error"
            );
            return;
        }

        if (!consent) {
            showMessage(
                message,
                "Please confirm the required consent.",
                "error"
            );
            return;
        }

        const donors = getDonors();
        const phoneToCheck = normalizePhone(phone);

        const duplicateExists = donors.some(function (donor) {
            return normalizePhone(donor.phone) === phoneToCheck;
        });

        if (duplicateExists) {
            showMessage(
                message,
                "This phone number is already registered.",
                "error"
            );
            return;
        }

        const donor = {
            id: (window.crypto &&
                 typeof window.crypto.randomUUID === "function")
                ? window.crypto.randomUUID()
                : String(Date.now()) +
                  Math.random().toString(16).slice(2),
            name,
            bloodGroup,
            age,
            city,
            area,
            phone
        };

        donors.push(donor);

        if (!saveDonors(donors)) {
            showMessage(
                message,
                "Could not save the record. Check browser storage.",
                "error"
            );
            return;
        }

        updateStats();
        donorForm.reset();

        showMessage(
            message,
            "Donor registered successfully!",
            "success"
        );
    });
}

// Search by blood group and city.
if (searchForm) {
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
                    "No matching records found. Try another city or group.",
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

            // Display phone numbers only with donor permission.
            card.appendChild(
                createTextElement("p", "Phone: " + donor.phone)
            );

            // Clickable call link.
            const callButton = document.createElement("a");
            callButton.textContent = "Call Donor";
            callButton.className = "btn-submit";
            callButton.href =
                "tel:" + normalizePhone(donor.phone);
            callButton.style.display = "inline-block";
            callButton.style.textDecoration = "none";
            callButton.style.textAlign = "center";
            callButton.style.marginTop = "10px";

            card.appendChild(callButton);
            results.appendChild(card);
        });
    });
}

// Clear search.
if (clearSearchButton && searchForm) {
    clearSearchButton.addEventListener("click", function () {
        searchForm.reset();
        results.replaceChildren();
    });
}

// Delete all demo records from this browser.
if (clearAllDonorsButton) {
    clearAllDonorsButton.addEventListener("click", function () {
        const donors = getDonors();

        if (donors.length === 0) {
            showMessage(adminMessage, "There are no records to delete.");
            return;
        }

        const confirmed = window.confirm(
            "Delete all donor records saved in this browser?"
        );

        if (!confirmed) {
            showMessage(adminMessage, "Deletion cancelled.");
            return;
        }

        try {
            localStorage.removeItem(STORAGE_KEY);

            updateStats();
            if (results) results.replaceChildren();

            showMessage(
                adminMessage,
                "All local records have been deleted.",
                "success"
            );

            showMessage(message, "");
        } catch (error) {
            console.error("Error deleting records:", error);

            showMessage(
                adminMessage,
                "Could not delete records. Check browser settings.",
                "error"
            );
        }
    });
}

// Initialize statistics.
updateStats();
