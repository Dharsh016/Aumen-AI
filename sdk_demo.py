from srs_sdk.api_client import ApiClient
from srs_sdk.api.words_api import WordsApi
from srs_sdk.models.word_create import WordCreate
from srs_sdk.configuration import Configuration

# ✅ SET BASE URL
config = Configuration(host="http://localhost:8001")

client = ApiClient(config)
api = WordsApi(client)

# Add a word
word = api.create_word_words_post(
    WordCreate(
        word="Quintessential",
        definition="Representing the most perfect example of something",
        language="English"
    )
)

print(f"Added: {word.word} (id: {word.id})")

# Get due words
due = api.get_due_words_words_due_get()
print(f"Due for review: {len(due)} words")

# Get history
history = api.get_history_words_history_get()
print(f"History entries: {len(history)}")

print("SDK demo completed successfully.")