import logging
import os
import sys

LOG_FILE = "app_requests.log"

def setup_logging():
    # Clear the log file if it exists (server restart)
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    
    # Create an empty log file
    with open(LOG_FILE, "w") as f:
        pass

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(LOG_FILE),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
