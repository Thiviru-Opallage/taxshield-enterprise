import os, json, base64, hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

load_dotenv()
KEY = bytes.fromhex(os.environ["TAXSHIELD_KEY"])
GENESIS = "0" * 64

def encrypt(payload: dict) -> str:
    nonce = os.urandom(12)
    ct = AESGCM(KEY).encrypt(nonce, json.dumps(payload).encode(), None)
    return base64.b64encode(nonce + ct).decode()

def decrypt(token: str) -> dict:
    raw = base64.b64decode(token)
    return json.loads(AESGCM(KEY).decrypt(raw[:12], raw[12:], None))

def chain_hash(prev_hash: str, encrypted: str) -> str:
    return hashlib.sha256((prev_hash + encrypted).encode()).hexdigest()