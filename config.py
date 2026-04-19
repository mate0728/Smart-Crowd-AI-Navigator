import os

DATABASE = "database.db"

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-key'
