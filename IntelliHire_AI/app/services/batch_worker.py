from .parser_service import parse_and_store
from ..cache.redis_Client import set_batch_status

def process_batch(file_paths: list, batch_id: str):
    try:
        print("Batch started:", batch_id)

        set_batch_status(batch_id, "parsing")

        for path in file_paths:
            parse_and_store(path, batch_id)

        set_batch_status(batch_id, "parsed")
        print("Batch completed:", batch_id)

    except Exception as e:
        print("Batch failed:", e)
        set_batch_status(batch_id, "failed")
