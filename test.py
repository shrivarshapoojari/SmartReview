from flask import Flask, request, render_template_string
import sqlite3

app = Flask(__name__)

# Initialize a simple in-memory database for demonstration
conn = sqlite3.connect(':memory:', check_same_thread=False)
cursor = conn.cursor()
cursor.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)')
cursor.execute("INSERT INTO users (username, password) VALUES ('admin', 'password')")
conn.commit()

@app.route('/')
def home():
    return render_template_string('''
        <h1>Welcome to Vulnerable Server</h1>
        <form action="/login" method="post">
            Username: <input type="text" name="username"><br>
            Password: <input type="password" name="password"><br>
            <input type="submit" value="Login">
        </form>
        <br>
        <form action="/search" method="get">
            Search: <input type="text" name="query"><br>
            <input type="submit" value="Search">
        </form>
    ''')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    # Vulnerability: SQL Injection
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    cursor.execute(query)
    user = cursor.fetchone()
    if user:
        return f"Welcome, {username}!"
    else:
        return "Invalid credentials!"

@app.route('/search')
def search():
    query = request.args.get('query', '')
    # Vulnerability: XSS (Cross-Site Scripting) - directly rendering user input
    return render_template_string(f'''
        <h1>Search Results</h1>
        <p>You searched for: {query}</p>
        <a href="/">Back</a>
    ''')

if __name__ == '__main__':
    app.run(debug=True)