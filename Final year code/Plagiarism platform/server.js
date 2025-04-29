const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const mammoth = require('mammoth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const pdfParse = require('pdf-parse');




const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());



app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});


db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to MySQL database');
    }
});

// Register Route
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
        db.query(query, [email, hashedPassword], (err, results) => {
            if (err) {
                console.error('Error inserting user:', err.message);
                return res.status(500).json({ message: 'Error registering user', error: err });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        console.error('Error hashing password:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Forgot Password Route
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        if (result.length === 0) return res.status(404).json({ message: 'Email not found' });

        const token = crypto.randomBytes(20).toString('hex'); // Generate reset token
        const expires = Date.now() + 3600000; // Token expires in 1 hour

        db.query('UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?', [token, expires, email], async (err) => {
            if (err) return res.status(500).json({ message: 'Database update error', error: err.message });

            const emailSent = await sendResetEmail(email, token);
            if (emailSent) {
                res.json({ message: 'Reset email sent' });
            } else {
                res.status(500).json({ message: 'Failed to send email' });
            }
        });
    });
});



// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        if (result.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

        const user = result[0];


        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Create token
            const token = jwt.sign(
                { id: user.id, email: user.email, isAdmin: user.isAdmin },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Update login status
            db.query('UPDATE users SET isUserLoggedIn = 1 WHERE id = ?', [user.id]);

            // Return login response with isAdmin flag
            res.status(200).json({
                message: 'Login successful',
                token,
                isAdmin: user.isAdmin
            });

        } catch (error) {
            console.error('Error comparing passwords:', error.message);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
});


// app.post('/logout', (req, res) => {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(400).json({ message: "Token not provided" });

//     try {
//         // Verify token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         // Set isUserLoggedIn to 0 (false)
//         db.query('UPDATE users SET isUserLoggedIn = 0 WHERE id = ?', [decoded.id], (err) => {
//             if (err) {
//                 return res.status(500).json({ message: "Error logging out" });
//             }
//             res.status(200).json({ message: "Logged out successfully" });
//         });
//     } catch (error) {
//         res.status(401).json({ message: "Invalid token" });
//     }
// });


app.get('/check-user-login/:userid', async (req, res) => {
    const { userid } = req.params;
    db.query('SELECT * FROM users WHERE id = ?', [userid], async (err, result) => {
        if (err) {
            return res.status(401).json({ error: "user not found" })
        }
        if (result) {
            if (result.isUserLoggedIn === true) {
                return res.status(200).json({ detail: "ok" })
            } else {
                return res.status(401).json({ error: "authentication required" });
            }
        }
    })
})


// app.get('/check-isadmin/:userid', async(req, res) => {
//     const {userid} = req.params;
//     db.query('SELECT * FROM users WHERE id = ?', [userid], async(err, result) => {
//         if (err) {
//             return res.status(401).json({error: "user not found"});
//         }
//         if (result) {
//             if (result.isAdmin === true) {
//                 return res.status(200).json({message: "ok"});
//             } else {
//                 return res.status(403).json({error: "permission denied"});
//             }
//         }
//     })
// })


app.get('/check-isadmin/:userid', (req, res) => {
    const { userid } = req.params;

    db.query('SELECT isAdmin FROM users WHERE id = ?', [userid], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Return if user is admin or not
        if (result[0].isAdmin === 1) {
            return res.status(200).json({ message: "User is an admin" });
        } else {
            return res.status(403).json({ error: "Not an admin" });
        }
    });
});



// // Middleware to verify token
// function verifyToken(req, res, next) {
//     const authHeader = req.headers('Authorization');
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) return res.status(403).json({ error: 'Token required' });

//     try {
//         const user = jwt.verify(token, process.env.JWT_SECRET)
//         req.user = user; // contains userId and isAdmin
//         next();
//     } catch (error) {
//         return res.status(403).json({ error: 'Invalid token' });
//     }
// }

// // Verify admin route
// app.get('/verifyAdmin', verifyToken, (req, res) => {
//     if (req.user.isAdmin === 1 || req.user.isAdmin === true) {
//         res.json({ isAdmin: true });
//     } else {
//         res.status(403).json({ isAdmin: false });
//     }
// });












// Reset Password Route
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    db.query('SELECT * FROM users WHERE reset_token = ? AND reset_expires > ?', [token, Date.now()], async (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        if (result.length === 0) return res.status(400).json({ message: 'Invalid or expired token' });

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.query('UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE email = ?',
                [hashedPassword, result[0].email], (err) => {
                    if (err) return res.status(500).json({ message: 'Failed to update password', error: err.message });
                    res.json({ message: 'Password reset successful' });
                });
        } catch (err) {
            console.error('Error hashing password:', err.message);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
});

// Function to send reset email
async function sendResetEmail(email, token) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const resetLink = `http://localhost:5000/reset-password.html?token=${token}`;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password Reset Request',
            text: `Click the link to reset your password: ${resetLink}`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending email:', error.message);
        return false;
    }
}

//users route
app.get('/users', (req, res) => {
    db.query('SELECT id, email FROM users', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});



app.get('/dashboard-stats', (req, res) => {
    const totalUsersQuery = "SELECT COUNT(*) AS totalUsers FROM users";
    const activeUsersQuery = "SELECT COUNT(*) AS activeUsers FROM users WHERE isUserLoggedIn = 1";
    const newUsersQuery = "SELECT COUNT(*) AS newUsers FROM users WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)";

    db.query(totalUsersQuery, (err, totalUsersResult) => {
        if (err) return res.status(500).json({ error: "Total users error" });

        db.query(activeUsersQuery, (err, activeUsersResult) => {
            if (err) return res.status(500).json({ error: "Active users error" });

            db.query(newUsersQuery, (err, newUsersResult) => {
                if (err) return res.status(500).json({ error: "New users error" });

                res.json({
                    totalUsers: totalUsersResult[0].totalUsers,
                    activeUsers: activeUsersResult[0].activeUsers,
                    newUsers: newUsersResult[0].newUsers
                });
            });
        });
    });
});



// Fetch login activity
app.get('/login-activity', (req, res) => {
    const sql = `
        SELECT u.email, u.isUserLoggedIn, ll.login_time 
        FROM users u
        LEFT JOIN (
            SELECT user_id, MAX(login_time) AS login_time
            FROM login_logs
            GROUP BY user_id
        ) ll ON u.id = ll.user_id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching login activity:", err);
            return res.status(500).json({ error: "Database error" });
        }

        const logs = results.map(user => ({
            email: user.email,
            login_time: user.login_time || "–",
            status: user.isUserLoggedIn ? "Online" : "Offline"
        }));

        res.json(logs);
    });
});







//UPLOAD FROM ADMIN
app.post('/upload-institution-doc', (req, res) => {
    const { title, content, category } = req.body;
    const sql = 'INSERT INTO institution_documents (title, content, category, uploaded_by) VALUES (?, ?, ?, "admin")';
    db.query(sql, [title, content, category], (err, result) => {
        if (err) return res.status(500).json({ message: "Error saving document", error: err });
        res.json({ message: "Document uploaded successfully!" });
    });
});

// Get documents by category
app.get('/get-documents/:category', (req, res) => {
    const category = req.params.category;

    const query = 'SELECT * FROM institution_documents WHERE category = ? ORDER BY upload_date DESC';

    db.query(query, [category], (err, results) => {
        if (err) {
            console.error("Error fetching documents:", err);
            return res.status(500).json({ message: "Error fetching documents" });
        }
        res.json(results);
    });
});


app.delete('/delete-user/:id', (req, res) => {
    const userId = req.params.id;

    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Error deleting user:", err);
            return res.status(500).json({ error: "Error deleting user" });
        }
        res.json({ message: "User deleted successfully" });
    });
});





// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
