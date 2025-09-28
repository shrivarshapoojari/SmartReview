from flask_pymongo import PyMongo
from cryptography.fernet import Fernet
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Initialize MongoDB
mongo = PyMongo()

# Encryption setup
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    # Generate a new key if not exists
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    # In production, this should be stored securely
    print(f"Generated new encryption key: {ENCRYPTION_KEY}")
    print("Add this to your .env file as ENCRYPTION_KEY")

cipher = Fernet(ENCRYPTION_KEY.encode())

def init_db(app):
    """Initialize database connection"""
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/smartreview")
    app.config["MONGO_URI"] = mongo_uri
    try:
        mongo.init_app(app)
        # Test the connection
        mongo.db.command('ping')
        logging.info("MongoDB connected successfully")
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        raise

def encrypt_api_key(api_key):
    """Encrypt API key"""
    return cipher.encrypt(api_key.encode()).decode()

def decrypt_api_key(encrypted_key):
    """Decrypt API key"""
    return cipher.decrypt(encrypted_key.encode()).decode()

class User:
    @staticmethod
    def create_or_update(github_id, groq_api_key):
        """Create or update user with encrypted API key"""
        if mongo.db is None:
            logging.error("Database not initialized - cannot create/update user")
            raise Exception("Database not initialized")
        encrypted_key = encrypt_api_key(groq_api_key)
        mongo.db.users.update_one(
            {"github_id": github_id},
            {"$set": {"groq_api_key": encrypted_key}},
            upsert=True
        )

    @staticmethod
    def get_by_github_id(github_id):
        """Get user by GitHub ID"""
        if mongo.db is None:
            logging.error("Database not initialized - cannot get user by GitHub ID")
            return None
        return mongo.db.users.find_one({"github_id": github_id})

    @staticmethod
    def has_api_key(github_id):
        """Check if user has API key configured"""
        if mongo.db is None:
            logging.error("Database not initialized - cannot check API key for user")
            return False
        user = User.get_by_github_id(github_id)
        return user is not None and "groq_api_key" in user

    @staticmethod
    def get_decrypted_api_key(github_id):
        """Get decrypted API key for user"""
        if mongo.db is None:
            logging.error("Database not initialized - cannot get decrypted API key for user")
            return None
        user = User.get_by_github_id(github_id)
        if user and "groq_api_key" in user:
            return decrypt_api_key(user["groq_api_key"])
        return None