const maxWords = 10000; // Maximum allowed word count

// Function to trigger the file input when the button is clicked
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

// Function to handle file uploads
function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    
    if (fileInput.files.length === 0) {
        alert("Please select a file.");
        return;
    }

    const file = fileInput.files[0];
    const fileType = file.type;

    if (fileType === "application/pdf") {
        readPdf(file);
    } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        readDocx(file);
    } else if (fileType === "text/plain") {
        readText(file);
    } else if (fileType === "text/csv") {
        readCsv(file);
    } else {
        alert("Unsupported file type");
    }
}

// Read and process PDF content
function readPdf(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const loadingTask = pdfjsLib.getDocument(new Uint8Array(e.target.result));
        loadingTask.promise.then(function(pdf) {
            let textContent = '';
            let promises = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                promises.push(
                    pdf.getPage(i).then(function(page) {
                        return page.getTextContent().then(function(text) {
                            text.items.forEach(function(item) {
                                textContent += item.str + ' ';
                            });
                        });
                    })
                );
            }

            Promise.all(promises).then(() => {
                document.getElementById('fileContent').value = textContent.trim();
                updateWordCount(textContent.trim());
            });
        }).catch(function(error) {
            console.error("Error reading PDF", error);
        });
    };
    reader.readAsArrayBuffer(file);
}

// Read and process DOCX content
function readDocx(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function(result) {
                document.getElementById('fileContent').value = result.value.trim();
                updateWordCount(result.value.trim());
            })
            .catch(function(err) {
                console.error("Error reading DOCX", err);
            });
    };
    reader.readAsArrayBuffer(file);
}

// Read and process plain text
function readText(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result.trim();
        document.getElementById('fileContent').value = text;
        updateWordCount(text);
    };
    reader.readAsText(file);
}

// Read and process CSV content
function readCsv(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvText = e.target.result;
        Papa.parse(csvText, {
            complete: function(results) {
                let csvContent = '';
                results.data.forEach(function(row) {
                    csvContent += row.join(", ") + " ";
                });
                document.getElementById('fileContent').value = csvContent.trim();
                updateWordCount(csvContent.trim());
            }
        });
    };
    reader.readAsText(file);
}

// Function to update word count
function updateWordCount(text) {
    const words = text.trim().split(/\s+/).filter(Boolean); // Split by whitespace and remove empty entries
    const wordCount = words.length;

    // Display count or reject if exceeds maxWords
    if (wordCount > maxWords) {
        alert("The text exceeds the 10,000-word limit.");
        const truncatedText = words.slice(0, maxWords).join(" ");
        document.getElementById('fileContent').value = truncatedText;
        document.getElementById('wordCount').innerText = `${maxWords}/${maxWords}`;
    } else {
        document.getElementById('wordCount').innerText = `${wordCount}/${maxWords}`;
    }
}

const plagScan = document.getElementById('plagScan');   
var fileContent = document.getElementById('fileContent');

plagScan.addEventListener("click",function(){
    if(fileContent.value === ''){
        alert('Add a text or upload a file');
    }
});