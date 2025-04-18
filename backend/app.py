# --- app.py ---
from flask import Flask, jsonify, request
from flask_cors import CORS
# Import Block class explicitly for type checking or instantiation if needed elsewhere
from blockchain import Blockchain, Block # Make sure Block is imported
# import threading

app = Flask(__name__)
CORS(app)

# --- Global State (remains the same) ---
INITIAL_DIFFICULTY = 4
blockchain_node = Blockchain(initial_difficulty=INITIAL_DIFFICULTY)
mempool = []
# mempool_lock = threading.Lock() # Optional

# --- API Endpoints (GET /blockchain, GET /mempool, POST /add_transaction, POST /mine_block remain the same) ---
@app.route('/api/blockchain', methods=['GET'])
def get_chain():
    """Returns the current blockchain state and node info."""
    response = {
        'chain': blockchain_node.get_chain_data(),
        'length': len(blockchain_node.chain),
        'current_difficulty': blockchain_node.difficulty,
        'mempool_size': len(mempool)
    }
    return jsonify(response), 200

@app.route('/api/mempool', methods=['GET'])
def get_mempool():
    """Returns the list of pending transactions."""
    response = {
        'transactions': list(mempool)
    }
    return jsonify(response), 200

@app.route('/api/add_transaction', methods=['POST'])
def add_transaction():
    """Adds a new transaction to the mempool, storing amount as string.""" # Modified docstring
    values = request.get_json()
    required = ['from_addr', 'to_addr', 'amount']
    if not values or not all(k in values for k in required):
        return jsonify({'message': 'Missing values (requires "from_addr", "to_addr", "amount")'}), 400

    try:
        # Validate amount as float first
        amount_float = float(values['amount'])
        if amount_float <= 0:
            raise ValueError("Amount must be positive.")

        # *** Store amount as string ***
        transaction = {
            'from_addr': str(values['from_addr']),
            'to_addr': str(values['to_addr']),
            'amount': str(amount_float) # Convert to string for storage
        }
    except (ValueError, TypeError) as e:
         return jsonify({'message': f'Invalid transaction data: {e}'}), 400

    mempool.append(transaction)
    print(f"Transaction added to mempool: {transaction}") # Log will show string amount
    response = {
        'message': 'Transaction added to mempool successfully',
        'mempool_size': len(mempool)
    }
    return jsonify(response), 201


@app.route('/api/mine_block', methods=['POST'])
def mine_block():
    """Mines a new block including transactions from the mempool."""
    if not mempool:
        return jsonify({'message': 'Mempool is empty. Add transactions before mining.'}), 400

    transactions_to_mine = list(mempool)
    mempool.clear()

    print(f"Mining new block with {len(transactions_to_mine)} transactions...")
    try:
        new_block = blockchain_node.add_block(transactions_to_mine)
        print(f"Successfully mined block #{new_block.index}")
        response = {
            'message': "New Block Forged",
            'block': new_block.to_dict(),
            'chain': blockchain_node.get_chain_data(),
            'current_difficulty': blockchain_node.difficulty,
            'mempool_size': len(mempool)
        }
        return jsonify(response), 201
    except Exception as e:
        print(f"Error during mining: {e}")
        # Consider putting transactions back in mempool on error?
        return jsonify({'message': f'Internal server error during mining: {e}'}), 500

@app.route('/api/validate_chain_state', methods=['POST'])
def validate_external_chain():
    """
    Validates a chain structure provided in the request body.
    Uses consistent timestamp string and explicit types.
    """
    values = request.get_json()
    if not values or 'chain' not in values or not isinstance(values['chain'], list):
        return jsonify({'message': 'Invalid request body. Requires {"chain": [blockDict, ...]}' }), 400

    chain_data = values['chain']
    chain_objects = []
    print(f"\n--- Received {len(chain_data)} blocks for validation ---") # Log start

    try:
        # Convert dictionaries back into Block objects with EXPLICIT TYPE CASTING
        for i, block_dict in enumerate(chain_data):
            # print(f"Reconstructing block {i} from dict: {block_dict}") # Verbose log
            required_keys = ['index', 'timestamp', 'data', 'previous_hash', 'difficulty', 'nonce', 'hash']
            if not all(key in block_dict for key in required_keys):
                 # Log the missing keys for better debugging
                 missing_keys = [key for key in required_keys if key not in block_dict]
                 raise ValueError(f"Block dictionary at index {i} missing required keys: {missing_keys}. Data: {block_dict}")

            # Explicit casting for numbers and ensuring strings are strings
            try:
                block_index = int(block_dict['index'])
                block_difficulty = int(block_dict['difficulty'])
                block_nonce = int(block_dict['nonce'])
                # *** Ensure timestamp is treated as the string it is ***
                block_timestamp_str = str(block_dict['timestamp'])
                block_prev_hash = str(block_dict['previous_hash'])
                block_hash = str(block_dict['hash'])
                block_data = block_dict['data'] # Pass data directly (should be list from JSON)

                # Basic check on data type if it's causing issues (should be list)
                if not isinstance(block_data, list):
                     print(f"Warning: Block data at index {i} is not a list: {type(block_data)} - Value: {block_data}")

            except (ValueError, TypeError, KeyError) as cast_err: # Added KeyError
                 raise ValueError(f"Invalid type/value or key error in block at index {i}: {cast_err} - Data: {block_dict}") from cast_err

            # Use the Block constructor signature: index, timestamp_str, data, previous_hash, difficulty, nonce, hash_val
            block = Block(
                index=block_index,
                timestamp_str=block_timestamp_str, # Pass the string timestamp
                data=block_data,
                previous_hash=block_prev_hash,
                difficulty=block_difficulty,
                nonce=block_nonce,
                hash_val=block_hash,          # Pass the hash from frontend state
                mined_timestamp=None          # Not used in hash calculation
            )
            chain_objects.append(block)

    except (TypeError, ValueError, KeyError) as e:
         print(f"!!! Error converting block dictionary to Block object: {e}")
         problematic_block_info = f" (Problem likely near index {i})" if 'i' in locals() else ""
         return jsonify({'message': f'Invalid block data format in provided chain{problematic_block_info}: {e}'}), 400

    # Call the static validation method (which now includes detailed logging)
    validation_result = Blockchain.validate_chain_structure(chain_objects)

    print(f"Validation requested for external chain state. Result: {validation_result}")
    return jsonify(validation_result), 200


# --- Main execution (remains the same) ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)