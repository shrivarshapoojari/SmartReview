from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from cryptography.fernet import Fernet
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Global MongoDB client
client = None
db = None

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
    global client, db
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/smartreview")
    print(f"Initializing database with URI: {mongo_uri}")
    
    try:
        client = MongoClient(mongo_uri, server_api=ServerApi('1'))
        print("Created MongoClient, attempting to ping...")
        # Send a ping to confirm a successful connection
        client.admin.command('ping')
        db = client.smartreview  # Use the smartreview database
        print("MongoDB connected successfully!")
        logging.info("MongoDB connected successfully")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
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
        print(f"Attempting to save API key for user {github_id}")
        try:
            encrypted_key = encrypt_api_key(groq_api_key)
            db.users.update_one(
                {"github_id": github_id},
                {"$set": {"groq_api_key": encrypted_key}},
                upsert=True
            )
            print(f"Successfully saved API key for user {github_id}")
        except Exception as e:
            print(f"Failed to save API key for user {github_id}: {e}")
            logging.error(f"Failed to save API key for user {github_id}: {e}")
            raise

    @staticmethod
    def get_by_github_id(github_id):
        """Get user by GitHub ID"""
        print(f"Attempting to get user {github_id}")
        try:
            user = db.users.find_one({"github_id": github_id})
            print(f"User {github_id} lookup result: {user is not None}")
            return user
        except Exception as e:
            print(f"Failed to get user {github_id}: {e}")
            logging.error(f"Failed to get user {github_id}: {e}")
            return None

    @staticmethod
    def has_api_key(github_id):
        """Check if user has API key configured"""
        print(f"Checking if user {github_id} has API key")
        try:
            user = User.get_by_github_id(github_id)
            has_key = user is not None and "groq_api_key" in user
            print(f"User {github_id} has API key: {has_key}")
            return has_key
        except Exception as e:
            print(f"Failed to check API key for user {github_id}: {e}")
            logging.error(f"Failed to check API key for user {github_id}: {e}")
            return False

    @staticmethod
    def get_decrypted_api_key(github_id):
        """Get decrypted API key for user"""
        print(f"Getting decrypted API key for user {github_id}")
        try:
            user = User.get_by_github_id(github_id)
            if user and "groq_api_key" in user:
                decrypted_key = decrypt_api_key(user["groq_api_key"])
                print(f"Successfully decrypted API key for user {github_id}")
                return decrypted_key
            else:
                print(f"No API key found for user {github_id}")
                return None
        except Exception as e:
            print(f"Failed to get decrypted API key for user {github_id}: {e}")
            logging.error(f"Failed to get decrypted API key for user {github_id}: {e}")
            return None