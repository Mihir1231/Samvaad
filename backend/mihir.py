import chromadb

DB_PATH = "D:/LDRP ITR/backend/chromadb_data/batch_2022-26"

client = chromadb.PersistentClient(path=DB_PATH)

print("Available collections:")
for coll in client.list_collections():
    print(" -", coll.name)
