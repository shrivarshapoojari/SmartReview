from flask import Flask, request, render_template_string
import sqlite3
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = './uploads'

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# --- Database setup ---
conn = sqlite3.connect('test.db', check_same_thread=False)
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)''')
c.execute("INSERT OR IGNORE INTO users (id, username, password) VALUES (1, 'admin', 'admin')")
conn.commit()

# --- Routes ---

# 1. SQL Injection
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        # Vulnerable: directly concatenating user input into SQL
        query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
        user = c.execute(query).fetchone()
        if user:
            return "Logged in!"
        else:
            return "Login failed!"
    return '''
        <form method="POST">
            Username: <input name="username"><br>
            Password: <input name="password" type="password"><br>
            <input type="submit">
        </form>
    '''

# 2. XSS
@app.route('/greet')
def greet():
    name = request.args.get('name', 'Guest')
    # Vulnerable: rendering unescaped user input
    return render_template_string(f"<h1>Hello, {name}!</h1>")

# 3. Insecure File Upload
@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        file = request.files['file']
        # Vulnerable: no file type check
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], file.filename))
        return f"Uploaded {file.filename}!"
    return '''
        <form method="POST" enctype="multipart/form-data">
            File: <input type="file" name="file"><br>
            <input type="submit">
        </form>
    '''

if __name__ == "__main__":
    app.run(debug=True)
