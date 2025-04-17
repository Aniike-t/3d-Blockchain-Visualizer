# --- blockchain.py (Refactored Validation) ---
import hashlib
import json
from time import time
from datetime import datetime

class Block:
    # Keep Block class exactly as before (with __init__, calculate_hash, to_dict)
    def __init__(self, index, timestamp, data, previous_hash, nonce=0, hash_val=None):
        self.index = index
        # Store timestamp as the string received, for consistent hashing with JSON
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        # If hash_val is provided (from frontend state), use it. Otherwise calculate (for genesis/new blocks)
        self.hash = hash_val if hash_val is not None else self.calculate_hash()

    def calculate_hash(self):
        """Calculates the SHA-256 hash of the block."""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp, # Use the stored timestamp string/value
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def to_dict(self):
        """Returns a dictionary representation of the block."""
        # Ensure timestamp in dict is the potentially original string format
        ts_str = self.timestamp if isinstance(self.timestamp, str) else str(datetime.fromtimestamp(self.timestamp))

        return {
            "index": self.index,
            "timestamp": ts_str,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "hash": self.hash
        }


class Blockchain:
    def __init__(self, difficulty=4):
        self.chain = []
        self.difficulty = difficulty
        self.create_genesis_block()

    def create_genesis_block(self):
        # Use time() for initial creation, convert to string for storage?
        # Let's store the original string timestamp consistently.
        ts = time()
        genesis_block = Block(0, str(datetime.fromtimestamp(ts)), "Genesis Block", "0", nonce=0)
        # Calculate hash after setting standard attributes
        genesis_block.hash = genesis_block.calculate_hash()
        self.chain.append(genesis_block)


    def get_latest_block(self):
        return self.chain[-1]

    def proof_of_work(self, block):
        # --- PoW logic remains the same ---
        target = "0" * self.difficulty
        block.nonce = 0
        while block.calculate_hash()[:self.difficulty] != target:
            block.nonce += 1
        print(f"Block mined with nonce: {block.nonce}")
        return block.nonce

    def add_block(self, data):
        latest_block = self.get_latest_block()
        new_block = Block(
            index=latest_block.index + 1,
            timestamp=str(datetime.fromtimestamp(time())), # Store as string
            data=data,
            previous_hash=latest_block.hash
        )
        new_block.nonce = self.proof_of_work(new_block)
        new_block.hash = new_block.calculate_hash()
        self.chain.append(new_block)
        return new_block

    def get_chain_data(self):
        return [block.to_dict() for block in self.chain]

    # --- Renamed internal validation ---
    def _is_chain_valid_internal(self):
        """Validates the instance's internal chain."""
        # Pass self.chain and self.difficulty to the static method
        result = Blockchain.validate_chain_structure(self.chain, self.difficulty)
        return result['is_valid']


    # --- NEW: Static method to validate any list of Block objects ---
    @staticmethod
    def validate_chain_structure(chain_to_validate, difficulty):
        """
        Validates the structure, hashes, and PoW of a given list of Block objects.
        Returns: dict {'is_valid': bool, 'first_invalid_index': int or None}
        """
        if not chain_to_validate:
            return {'is_valid': True, 'first_invalid_index': None}

        target = "0" * difficulty

        # 1. Validate Genesis Block (basic checks)
        genesis = chain_to_validate[0]
        # Check hash recalculation (most important)
        if genesis.hash != genesis.calculate_hash():
            print(f"Backend Validation Error: Genesis hash mismatch!")
            return {'is_valid': False, 'first_invalid_index': 0}
        # Optional: Check standard genesis properties
        # if genesis.index != 0 or genesis.previous_hash != "0":
        #     print(f"Backend Validation Error: Genesis properties incorrect!")
        #     return {'is_valid': False, 'first_invalid_index': 0}


        # 2. Validate subsequent blocks
        for i in range(1, len(chain_to_validate)):
            current_block = chain_to_validate[i]
            previous_block = chain_to_validate[i-1]

            # Check hash recalculation using current block's data
            calculated_hash = current_block.calculate_hash()
            if current_block.hash != calculated_hash:
                print(f"Backend Validation Error: Hash mismatch at index {i}. Expected {current_block.hash}, calculated {calculated_hash}")
                return {'is_valid': False, 'first_invalid_index': i}

            # Check previous hash link
            if current_block.previous_hash != previous_block.hash:
                print(f"Backend Validation Error: Previous hash link broken at index {i}. Block has {current_block.previous_hash}, previous block has {previous_block.hash}")
                return {'is_valid': False, 'first_invalid_index': i}

            # Check Proof of Work (using the hash stored in the block)
            # Note: We trust the block's *stored* hash for PoW check,
            # because recalculating it here would pass even if data was tampered AFTER mining.
            # The hash mismatch check above catches tampering.
            if current_block.hash[:difficulty] != target:
                print(f"Backend Validation Error: Proof of Work invalid at index {i} for hash {current_block.hash}")
                return {'is_valid': False, 'first_invalid_index': i}

        # All blocks passed
        return {'is_valid': True, 'first_invalid_index': None}