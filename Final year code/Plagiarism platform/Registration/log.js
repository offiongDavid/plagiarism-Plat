const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

// Send to backend
fetch("http://localhost:3000/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
})
  .then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error("Invalid credentials");
    }
  })
  .then((data) => {
    console.log("Token:", data.token);
    alert("Login successful!");
  })
  .catch((error) => {
    console.error(error.message);
    document.getElementById("errorMessage").innerText = error.message;
  });
