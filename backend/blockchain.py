# --- blockchain.py (No changes from the previous feature-rich version) ---
import hashlib
import json
from time import time
from datetime import datetime

class Block:
    def __init__(self, index, timestamp, data, previous_hash, nonce=0, hash_val=None):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = hash_val if hash_val is not None else self.calculate_hash()

    def calculate_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def to_dict(self):
        return {
            "index": self.index,
            "timestamp": str(datetime.fromtimestamp(self.timestamp)),
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "hash": self.hash
        }

class Blockchain:
    def __init__(self, difficulty=4): # Keep difficulty
        self.chain = []
        self.difficulty = difficulty
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = Block(0, time(), "Genesis Block", "0", nonce=0)
        # Genesis hash should be calculated correctly now
        genesis_block.hash = genesis_block.calculate_hash()
        self.chain.append(genesis_block)

    def get_latest_block(self):
        return self.chain[-1]

    def proof_of_work(self, block):
        target = "0" * self.difficulty
        block.nonce = 0
        # Ensure hash is calculated inside the loop using the current nonce
        while block.calculate_hash()[:self.difficulty] != target:
            block.nonce += 1
            # Optional safety break can be added here if needed
        print(f"Block mined with nonce: {block.nonce}")
        return block.nonce # Return the found nonce

    def add_block(self, data):
        latest_block = self.get_latest_block()
        new_block = Block(
            index=latest_block.index + 1,
            timestamp=time(),
            data=data,
            previous_hash=latest_block.hash
            # Nonce set by PoW, hash calculated after PoW
        )
        new_block.nonce = self.proof_of_work(new_block)
        new_block.hash = new_block.calculate_hash() # Calculate final hash with correct nonce

        self.chain.append(new_block)
        return new_block

    def get_chain_data(self):
        return [block.to_dict() for block in self.chain]

    def is_chain_valid(self):
        # Genesis block check (optional but good)
        genesis = self.chain[0]
        if genesis.hash != genesis.calculate_hash():
             print(f"Validation Error: Genesis block hash mismatch")
             return False

        # Check remaining blocks
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]

            if current_block.hash != current_block.calculate_hash():
                print(f"Validation Error: Current hash mismatch at index {i}")
                return False

            if current_block.previous_hash != previous_block.hash:
                print(f"Validation Error: Previous hash link broken at index {i}")
                return False

            # Validate PoW for non-genesis blocks
            target = "0" * self.difficulty
            if current_block.hash[:self.difficulty] != target:
                print(f"Validation Error: Proof of Work invalid at index {i}")
                return False
        return True