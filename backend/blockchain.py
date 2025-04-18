# --- blockchain.py (Revised Timestamp Handling & Validation Logging) ---
import hashlib
import json
from time import time
from datetime import datetime

# --- Configuration ---
BLOCK_GENERATION_INTERVAL = 10
DIFFICULTY_ADJUSTMENT_INTERVAL = 5
MIN_DIFFICULTY = 1


class Block:
    # Constructor now takes timestamp_str directly
    def __init__(self, index, timestamp_str, data, previous_hash, difficulty, nonce=0, hash_val=None, mined_timestamp=None):
        self.index = index
        self.timestamp = timestamp_str # Store the exact string used for hashing
        self.data = data # Should be a list of transactions/dicts
        self.previous_hash = previous_hash
        self.difficulty = difficulty
        self.nonce = nonce
        # Record the Unix time when mining finished (for difficulty adjustment)
        # If mined_timestamp (Unix float) is provided, use it, else record current time
        self.mined_timestamp = mined_timestamp if mined_timestamp is not None else time()

        # Hash calculation happens only if hash_val is None (newly mined or genesis)
        # Uses the stored self.timestamp string directly
        self.hash = hash_val if hash_val is not None else self.calculate_hash()

    def calculate_hash(self):
        """Calculates the SHA-256 hash of the block using stored string timestamp."""
        block_content = {
            "index": self.index,
            "timestamp": self.timestamp, # Use the stored string directly
            "data": self.data,
            "previous_hash": self.previous_hash,
            "difficulty": self.difficulty,
            "nonce": self.nonce
        }
        try:
            # Use separators=(',', ':') for the most compact, unambiguous JSON representation
            # Ensure UTF-8 encoding
            block_string = json.dumps(block_content, sort_keys=True, separators=(',', ':')).encode('utf-8')
        except TypeError as e:
            # Add logging for serialization errors
            print(f"!!! ERROR Serializing block content for hashing block index {self.index}: {e}")
            print(f"    Content causing error: {block_content}")
            raise # Re-raise the error after logging

        return hashlib.sha256(block_string).hexdigest()

    def to_dict(self):
        """Returns a dictionary representation of the block."""
        return {
            "index": self.index,
            "timestamp": self.timestamp, # Return the stored string timestamp
            "data": self.data,
            "previous_hash": self.previous_hash,
            "difficulty": self.difficulty,
            "nonce": self.nonce,
            "hash": self.hash,
            # Optional: Include mined_timestamp for frontend debugging/display if needed
            # "mined_timestamp_unix": self.mined_timestamp
        }


class Blockchain:
    def __init__(self, initial_difficulty=4):
        self.chain = []
        self.difficulty = max(MIN_DIFFICULTY, initial_difficulty)
        self.create_genesis_block()

    def create_genesis_block(self):
        """Creates the Genesis block and performs PoW."""
        genesis_time_unix = time()
        # *** Generate timestamp string ONCE using a standard format ***
        # ISO format is generally good and includes microseconds by default
        genesis_timestamp_str = datetime.fromtimestamp(genesis_time_unix).isoformat(sep=' ', timespec='microseconds')


        genesis_block = Block(
            index=0,
            timestamp_str=genesis_timestamp_str, # Pass the string
            data=[{"info": "Genesis Block"}], # Consistent list format
            previous_hash="0",
            difficulty=self.difficulty,
            nonce=0,
            mined_timestamp=genesis_time_unix, # Pass the Unix time for adjustment logic
            hash_val=None # Calculate hash after PoW
        )

        # proof_of_work will modify genesis_block.nonce and return (nonce, hash)
        mined_nonce, final_hash = self.proof_of_work(genesis_block)

        # Update the block with the results from PoW
        genesis_block.hash = final_hash # Assign the calculated valid hash

        self.chain.append(genesis_block)
        # Log the exact timestamp string used
        print(f"Genesis block created and mined. Nonce: {genesis_block.nonce}, Hash: {genesis_block.hash[:10]}..., Difficulty: {genesis_block.difficulty}, Timestamp: '{genesis_timestamp_str}'")


    def get_latest_block(self):
        return self.chain[-1]

    def proof_of_work(self, block):
        """Finds a nonce that satisfies the difficulty target."""
        block.nonce = 0
        target = "0" * block.difficulty
        calculated_hash = block.calculate_hash() # Initial hash

        while calculated_hash[:block.difficulty] != target:
            block.nonce += 1
            calculated_hash = block.calculate_hash() # Recalculate

        # print(f"Block mined with nonce: {block.nonce}, Hash: {calculated_hash}") # Optional: Verbose logging
        return block.nonce, calculated_hash

    def adjust_difficulty(self):
        """Adjusts difficulty based on block generation time."""
        latest_block = self.get_latest_block()

        if latest_block.index % DIFFICULTY_ADJUSTMENT_INTERVAL == 0 and latest_block.index > 0:
            try:
                prev_adjustment_block = self.chain[-(DIFFICULTY_ADJUSTMENT_INTERVAL + 1)]
            except IndexError:
                 print("Warning: Could not find previous adjustment block for difficulty calculation.")
                 return self.difficulty

            actual_time = latest_block.mined_timestamp - prev_adjustment_block.mined_timestamp
            expected_time = DIFFICULTY_ADJUSTMENT_INTERVAL * BLOCK_GENERATION_INTERVAL

            print(f"\n--- Difficulty Adjustment Check @ Block {latest_block.index} ---")
            print(f"  Time for last {DIFFICULTY_ADJUSTMENT_INTERVAL} blocks: {actual_time:.2f}s (Expected: {expected_time}s)")
            print(f"  Current difficulty: {self.difficulty}")

            if actual_time < expected_time / 1.5:
                self.difficulty += 1
                print(f"  Mining too fast. Increasing difficulty to: {self.difficulty}")
            elif actual_time > expected_time * 1.5:
                new_difficulty = max(MIN_DIFFICULTY, self.difficulty - 1)
                if new_difficulty != self.difficulty:
                     print(f"  Mining too slow. Decreasing difficulty to: {new_difficulty}")
                     self.difficulty = new_difficulty
                else:
                     print(f"  Mining too slow, but already at minimum difficulty ({MIN_DIFFICULTY}).")
            else:
                 print("  Block generation time within target range. Difficulty unchanged.")
            print("-" * 40)

        return self.difficulty


    def add_block(self, data):
        """Creates, mines, and adds a new block."""
        if not isinstance(data, list):
             # Maybe allow non-list data but log a warning? For now, enforce list.
             raise ValueError("Block data must be provided as a list (e.g., of transactions).")

        latest_block = self.get_latest_block()
        current_difficulty = self.adjust_difficulty() # Check/adjust difficulty first
        block_time_unix = time()
        # *** Generate timestamp string ONCE using a standard format ***
        block_timestamp_str = datetime.fromtimestamp(block_time_unix).isoformat(sep=' ', timespec='microseconds')

        new_block = Block(
            index=latest_block.index + 1,
            timestamp_str=block_timestamp_str, # Pass the generated string
            data=data,
            previous_hash=latest_block.hash,
            difficulty=current_difficulty,
            nonce=0,
            mined_timestamp=block_time_unix, # Pass Unix time for adjustment logic
            hash_val=None # Calculate hash after PoW
        )

        # Perform Proof of Work
        mined_nonce, final_hash = self.proof_of_work(new_block)

        # Assign results from PoW
        new_block.hash = final_hash
        # Update mined_timestamp to the *actual* time PoW finished
        # This is important for the *next* difficulty adjustment calculation
        new_block.mined_timestamp = time()

        self.chain.append(new_block)
        # Log the exact timestamp string used
        print(f"Block #{new_block.index} added. Nonce: {new_block.nonce}, Hash: {new_block.hash[:10]}..., Difficulty: {new_block.difficulty}, Timestamp: '{block_timestamp_str}'")
        return new_block

    def get_chain_data(self):
        """Returns the chain as a list of dictionaries."""
        return [block.to_dict() for block in self.chain]

    # --- Static Validation Method (with DETAILED logging) ---
    @staticmethod
    def validate_chain_structure(chain_to_validate):
        """Validates the structure, hashes, links, and PoW of a given list of Block objects."""
        if not chain_to_validate:
            print("Validation Warning: Chain to validate is empty.")
            return {'is_valid': True, 'first_invalid_index': None}

        # Helper to generate the string exactly as calculate_hash does
        def get_hash_input_string(block):
             content = {
                "index": block.index, "timestamp": block.timestamp, "data": block.data,
                "previous_hash": block.previous_hash, "difficulty": block.difficulty, "nonce": block.nonce
             }
             return json.dumps(content, sort_keys=True, separators=(',', ':'))


        # 1. Validate Genesis Block
        genesis = chain_to_validate[0]
        print(f"\n--- Validating Genesis Block (Index {genesis.index}) ---")
        if genesis.index != 0:
             print(f"!!! Validation Error: Genesis block index is not 0 (found {genesis.index}).")
             return {'is_valid': False, 'first_invalid_index': 0}

        genesis_recalculated_hash = genesis.calculate_hash()
        print(f"  Stored Hash:       {genesis.hash}")
        print(f"  Recalculated Hash: {genesis_recalculated_hash}")
        if genesis.hash != genesis_recalculated_hash:
            print(f"!!! Validation Error: Genesis hash mismatch!")
            print(f"    Input string for recalc: {get_hash_input_string(genesis)}") # Log exact input string
            return {'is_valid': False, 'first_invalid_index': 0}

        genesis_target = "0" * genesis.difficulty
        print(f"  PoW Check: Hash starts with '{genesis.hash[:genesis.difficulty]}', Target prefix: '{genesis_target}' (Difficulty: {genesis.difficulty})")
        if genesis.hash[:genesis.difficulty] != genesis_target:
             print(f"!!! Validation Error: Genesis Proof of Work invalid!")
             return {'is_valid': False, 'first_invalid_index': 0}
        print("-" * 20)


        # 2. Validate subsequent blocks
        for i in range(1, len(chain_to_validate)):
            current_block = chain_to_validate[i]
            previous_block = chain_to_validate[i-1]
            print(f"--- Validating Block #{current_block.index} ---")

            # Check index order
            if current_block.index != previous_block.index + 1:
                 print(f"!!! Validation Error: Index mismatch at block {i}. Expected {previous_block.index + 1}, got {current_block.index}.")
                 return {'is_valid': False, 'first_invalid_index': i}

            # Check previous hash link
            if current_block.previous_hash != previous_block.hash:
                print(f"!!! Validation Error: Previous hash link broken at block {i}.")
                print(f"    Block {i} previous_hash: {current_block.previous_hash}")
                print(f"    Block {i-1} hash:        {previous_block.hash}")
                return {'is_valid': False, 'first_invalid_index': i}

            # Check hash recalculation (Tampering check)
            calculated_hash = current_block.calculate_hash()
            print(f"  Stored Hash:       {current_block.hash}")
            print(f"  Recalculated Hash: {calculated_hash}")
            if current_block.hash != calculated_hash:
                print(f"!!! Validation Error: Hash mismatch at block {i} (Tampering suspected).")
                print(f"    Input string for recalc: {get_hash_input_string(current_block)}") # Log exact input string
                # Further log individual components if needed:
                # print(f"      index={current_block.index}, type={type(current_block.index)}")
                # print(f"      timestamp='{current_block.timestamp}', type={type(current_block.timestamp)}")
                # print(f"      data={current_block.data}, type={type(current_block.data)}")
                # print(f"      previous_hash='{current_block.previous_hash}', type={type(current_block.previous_hash)}")
                # print(f"      difficulty={current_block.difficulty}, type={type(current_block.difficulty)}")
                # print(f"      nonce={current_block.nonce}, type={type(current_block.nonce)}")
                return {'is_valid': False, 'first_invalid_index': i}

            # Check Proof of Work
            block_target = "0" * current_block.difficulty
            print(f"  PoW Check: Hash starts with '{current_block.hash[:current_block.difficulty]}', Target prefix: '{block_target}' (Difficulty: {current_block.difficulty})")
            if current_block.hash[:current_block.difficulty] != block_target:
                print(f"!!! Validation Error: Proof of Work invalid at block {i}.")
                return {'is_valid': False, 'first_invalid_index': i}
            print("-" * 20)


        print(f"\nValidation successful for chain of length {len(chain_to_validate)}.")
        return {'is_valid': True, 'first_invalid_index': None}