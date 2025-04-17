# --- app.py (Added validation endpoint for arbitrary chain) ---
from flask import Flask, jsonify, request
from flask_cors import CORS
# Import Block class explicitly if needed for type checking or instantiation
from blockchain import Blockchain, Block

app = Flask(__name__)
CORS(app)

# Instance of the blockchain for mining and getting the canonical chain
blockchain_node = Blockchain(difficulty=4)

@app.route('/api/blockchain', methods=['GET'])
def get_chain():
    response = {
        'chain': blockchain_node.get_chain_data(),
        'length': len(blockchain_node.chain),
    }
    return jsonify(response), 200

@app.route('/api/mine_block', methods=['POST'])
def mine_block():
    values = request.get_json()
    required = ['data']
    if not values or not all(k in values for k in required):
        return jsonify({'message': 'Missing values (requires "data")'}), 400

    block_data = values['data']
    if not isinstance(block_data, str) or not block_data.strip():
         return jsonify({'message': 'Block data cannot be empty or non-string'}), 400

    try:
        # Use the node's instance to add to its chain
        new_block = blockchain_node.add_block(block_data)
        response = {
            'message': "New Block Forged",
            'block': new_block.to_dict(),
            'chain': blockchain_node.get_chain_data() # Send updated canonical chain
        }
        return jsonify(response), 201
    except Exception as e:
        print(f"Error during mining: {e}")
        return jsonify({'message': 'Internal server error during mining'}), 500


# --- NEW ENDPOINT ---
@app.route('/api/validate_chain_state', methods=['POST'])
def validate_external_chain():
    """
    Validates a chain structure provided in the request body.
    Expects JSON: { "chain": [ blockDict1, blockDict2, ... ] }
    """
    values = request.get_json()
    if not values or 'chain' not in values or not isinstance(values['chain'], list):
        return jsonify({'message': 'Invalid request body. Requires {"chain": [blockDict, ...]}' }), 400

    chain_data = values['chain']
    chain_objects = []

    try:
        # Convert dictionaries back into Block objects
        for block_dict in chain_data:
            # Basic check for essential keys
            required_keys = ['index', 'timestamp', 'data', 'previous_hash', 'nonce', 'hash']
            if not all(key in block_dict for key in required_keys):
                 raise ValueError(f"Block dictionary missing required keys: {block_dict}")

            block = Block(
                index=block_dict['index'],
                timestamp=block_dict['timestamp'], # Pass timestamp string directly
                data=block_dict['data'],
                previous_hash=block_dict['previous_hash'],
                nonce=block_dict['nonce'],
                hash_val=block_dict['hash'] # Crucial: Pass the hash from the frontend state
            )
            chain_objects.append(block)

    except (TypeError, ValueError, KeyError) as e:
         print(f"Error converting block dictionary to Block object: {e}")
         return jsonify({'message': f'Invalid block data format in provided chain: {e}'}), 400

    # Validate the constructed list of Block objects using the static method
    # Pass the difficulty from the node's instance
    validation_result = Blockchain.validate_chain_structure(chain_objects, blockchain_node.difficulty)

    print(f"Validation requested for external chain state. Result: {validation_result}")
    return jsonify(validation_result), 200


# Optional: Keep the old endpoint for validating the internal chain if needed?
# @app.route('/api/validate', methods=['GET'])
# def validate_internal_chain():
#     """Validates the node's internal blockchain."""
#     is_valid = blockchain_node._is_chain_valid_internal() # Call internal check
#     response = {'message': 'Node internal chain is valid' if is_valid else 'Node internal chain is invalid!', 'is_valid': is_valid}
#     return jsonify(response), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)