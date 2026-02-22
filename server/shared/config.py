import os

from dotenv import load_dotenv

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
SUPABASE_BOOKS_BUCKET = os.getenv("SUPABASE_BOOKS_BUCKET", "books")
DRAMATIQ_BROKER_URL = os.getenv("DRAMATIQ_BROKER_URL", "redis://localhost:6379/0")
APP_REDIS_URL = os.getenv("APP_REDIS_URL", DRAMATIQ_BROKER_URL)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
HUME_API_KEY = os.getenv("HUME_API_KEY", "")
