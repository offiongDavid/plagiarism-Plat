// Select specific links
const link1 = document.querySelector('.link1'); // Link for "New Scan"
const link2 = document.querySelector('.link2'); // Link for "My Scans"
const link3 = document.querySelector('.link3'); // Link for "My Scans"


// Sections
const section1 = document.getElementById('section1');
const section2 = document.getElementById('section2');
const section3 = document.getElementById('profileSection');
const newPage = document.getElementById('newPage'); // New scan page

const newScanBtn = document.getElementById('newScanBtn');

newScanBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent page reload
    section1.classList.remove('active'); // Hide "My Scans" section
    section2.classList.add('active'); // Show "New Scan" section
    newPage.style.display = 'none';
});
// Event listener for "New Scan" link
link1.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent page reload
    section1.classList.remove('active'); // Hide "My Scans" section
    section2.classList.add('active'); // Show "New Scan" section
    section3.classList.remove('active'); // Show "New Scan" section
    newPage.style.display = 'none'; // Keep new scan page hidden initially
});

// Event listener for "My Scans" link
link2.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent page reload
    section1.classList.add('active'); // Show "My Scans" section
    section2.classList.remove('active'); // Hide "New Scan" section
    section3.classList.remove('active'); // Hide "New Scan" section
    newPage.style.display = 'none'; // Hide the new scan page content
});


// Event listener for "My Scans" link
link3.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent page reload
    section3.classList.add('active'); // Show "My Scans" section
    section2.classList.remove('active'); // Hide "New Scan" section
    section1.classList.remove('active'); // Hide "New Scan" section
    newPage.style.display = 'none'; // Hide the new scan page content
});
// Get elements for buttons and file upload
const textButton = document.getElementById('textButton');
const fileButton = document.getElementById('fileButton');
const newScanFileInput = document.getElementById('newScanFileInput');
const textArea = document.getElementById('textArea');
const goBackLink = document.getElementById('goBackLink');
const dropArea = document.getElementById('dropArea');

// Show the new page when the "Text" button is clicked
textButton.addEventListener('click', function () {
    newPage.style.display = 'block'; // Show new page content
    textArea.value = ''; // Clear text area
});

// Handle "Files" button click to show the text area and upload file
fileButton.addEventListener('click', function () {
    newPage.style.display = 'block'; // Show new page content
    newScanFileInput.click(); // Trigger file input click to upload a file
});

// Handle file input change
newScanFileInput.addEventListener('change', function (event) {
    const files = event.target.files[0];
    if (files) {
        handleFileUpload(files);
    }
});

// Handle drag-and-drop functionality for the drop area
dropArea.addEventListener('dragover', function (event) {
    event.preventDefault(); // Prevent default behavior
    dropArea.classList.add('drag-over'); // Highlight drop area
});

dropArea.addEventListener('dragleave', function () {
    dropArea.classList.remove('drag-over'); // Remove highlight
});

dropArea.addEventListener('drop', function (event) {
    event.preventDefault();
    dropArea.classList.remove('drag-over');

    const file = event.dataTransfer.files[0];
    if (file && file.type !== 'application/pdf') {
        alert("Only PDF files are allowed.");
        return;
    }

    if (file) {
        handleFileUpload(file);
    }
});

// Handle file upload and display content
function handleFileUpload(files) {
    const fileType = files.type;
   
    if (fileType !== 'application/pdf') {
        alert("Only PDF files are allowed.");
        return;
    }

    const reader = new FileReader();


    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

    const pdfReader = new FileReader();
    pdfReader.onload = function (e) {
        const typedArray = new Uint8Array(e.target.result);
        pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {
            let pdfText = '';
            const totalPages = pdf.numPages;

            const getPageText = async (pageNum) => {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                return textContent.items.map((item) => item.str).join(' ');
            };

            (async function extractText() {
                for (let i = 1; i <= totalPages; i++) {
                    pdfText += await getPageText(i) + '\n\n';
                }
                textArea.value = pdfText; // Display PDF content in the text area
            })();
        });
    };
    pdfReader.readAsArrayBuffer(files);
}

// Handle "Go Back" link to return to the main dashboard
goBackLink.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent default link behavior
    newPage.style.display = 'none'; // Hide the new scan page content
});

// Object to map file extensions to icons
const fileIcons = {
    'pdf': '/Images/pdf.png',
    'docx': '/Images/doc.png',
    'txt': '/Images/txt.png',
    'pptx': '/Images/ppt.png',
    'xlsx': '/Images/xls.png',
    'default': '/Images/default-icon.png', // Fallback icon
};

// Variable to store the currently selected row index
let selectedRowIndex = null;

const formData = new FormData();

// Handle file upload and display the file details in the table
function handleUpload(event) {
    let storedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];

    // Add new files to the storedFiles array
    let files = event.target.files;
    formData.append("file", files[0]);
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let fileName = file.name;

        
        // ✅ Check for PDF only
        if (file.type !== 'application/pdf') {
            alert("Only PDF files are allowed.");
            continue;
        }
        
        let fileExtension = file.name.split('.').pop().toLowerCase(); // Extract extension
        let fileDate = new Date().toLocaleDateString(); // Current date
        let plagiarismScore = "Not checked"; // Placeholder

        // Create file object and add it to the storedFiles array
        storedFiles.push({
            name: fileName,
            extension: fileExtension,
            date: fileDate,
            plagiarismScore: plagiarismScore,
        });
    }

    // Save the updated array back to localStorage
    localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));

    // Reload the table with the updated stored files
    loadStoredFiles();
}

// Load stored files from localStorage and display them
function loadStoredFiles() {
    showPreloader();
    setTimeout(() => {
        let storedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];

        let tableBody = document.getElementById('scansTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; // Clear any existing rows

        storedFiles.forEach((fileData, index) => {
            let newRow = tableBody.insertRow();

            // Add hover and click event listeners to highlight and focus
            newRow.addEventListener('mouseenter', () => newRow.style.backgroundColor = '#f0f0f0');
            newRow.addEventListener('mouseleave', () => {
                if (selectedRowIndex !== index) newRow.style.backgroundColor = '';
            });
            newRow.addEventListener('click', () => {
                // Deselect previously selected row
                if (selectedRowIndex !== null) {
                    let rows = tableBody.getElementsByTagName('tr');
                    rows[selectedRowIndex].style.backgroundColor = '';
                }

                // Select the current row
                selectedRowIndex = index;
                newRow.style.backgroundColor = '#d0e8ff';
            });

            // Add the file type as an icon
            let typeCell = newRow.insertCell(0);
            let icon = document.createElement('img');
            let fileIcon = fileIcons[fileData.extension] || fileIcons['default'];
            icon.src = fileIcon;
            icon.alt = fileData.extension + " icon";
            icon.width = 30;
            typeCell.appendChild(icon);

            // Add the file name
            newRow.insertCell(1).innerText = fileData.name;

            // Add the file upload date
            newRow.insertCell(2).innerText = fileData.date;

            // Add the plagiarism score
            newRow.insertCell(3).innerText = fileData.plagiarismScore;
        });

        hidePreloader();
    }, 500); // Simulate a slight delay for loading
}

// Delete the selected file
function deleteSelectedFile() {
    if (selectedRowIndex === null) {
        alert("Please select a file to delete.");
        return;
    }

    // Retrieve stored files from localStorage
    let storedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];

    // Remove the selected file from the array
    storedFiles.splice(selectedRowIndex, 1);

    // Save the updated array back to localStorage
    localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));

    // Reset the selected row index
    selectedRowIndex = null;

    // Reload the table to reflect the changes
    loadStoredFiles();
}

// Select the preloader element
const preloader = document.getElementById('preloader');

// Refresh the table when the refresh icon is clicked
function refreshTable() {
    showPreloader(); // Show the preloader
    setTimeout(() => {
        loadStoredFiles(); // Simulate the loading process
        hidePreloader(); // Hide the preloader after a delay
    }, 2000); // Adjust the duration (in milliseconds) as needed
}

// Show the preloader
function showPreloader() {
    preloader.style.display = 'flex'; // Ensure the preloader is visible
}

// Hide the preloader
function hidePreloader() {
    preloader.style.display = 'none'; // Hide the preloader
}

// Load stored files when the page is loaded
window.onload = function () {
    showPreloader();
    setTimeout(() => {
        loadStoredFiles(); // Simulate initial loading
        hidePreloader();
    }, 2000);
};

// Attach refresh function to the refresh icon/button
document.getElementById('refreshButton').addEventListener('click', refreshTable);

// Attach delete function to the delete icon/button
document.getElementById('deleteButton').addEventListener('click', deleteSelectedFile);
document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        document.getElementById('userEmail').textContent = `Welcome, ${userEmail}`;
        document.getElementById('profileEmail').textContent = `${userEmail}`;
    }
});

const password = localStorage.getItem('password');
// const passwordLength = password.length;
// const bulletPassword = '*'.repeat(passwordLength);

document.getElementById('profilePassword').textContent = password;

// Optional: Clear email and token from localStorage on logout
document.querySelector('.logout-btn button').addEventListener('click', async () => {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const response = await fetch('http://localhost:5000/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                localStorage.removeItem('userEmail');
                localStorage.removeItem('token');
                window.location.href = '/Final year code/Plagiarism platform/Registration/login.html';
            } else {
                const data = await response.json();
                alert("Logout failed: " + data.message);
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert("An error occurred during logout.");
        }
    } else {
        window.location.href = '/Final year code/Plagiarism platform/Registration/login.html'; // fallback
    }
});



const userInp = document.getElementById("userName");
const upDate = document.getElementById("upDate");
const useName = document.getElementById("useName");
upDate.addEventListener("click", function () {
    const userVal = document.getElementById("userName").value;
    useName.textContent = userVal;
    userInp.style.display = `none`;


}

)


function testClick() {
   
    const category = document.getElementById('docCategory').value;
    const fileInput = document.getElementById('uploadFileInput'); // We’ll add this input





    formData.append('category', category);
    const userid = localStorage.getItem("userid");
    if (!category || !formData.get("file")) {
        alert("Please select a category and upload a PDF document.");
        return;
    }
fetch(`http://localhost:8000/api/check/${1}`, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        console.log('Upload success:', data);
        alert('Document sent successfully!');
    })
    .catch(err => {
        console.error('Upload failed:', err);
        alert('There was an error uploading your document.');
    });



}

  function toggleMenu() {
    const sidebar = document.querySelector('.nav-bar');
    sidebar.classList.toggle('active');
  }

