# --- app.py (No changes from the previous feature-rich version) ---
from flask import Flask, jsonify, request
from flask_cors import CORS
from blockchain import Blockchain

app = Flask(__name__)
CORS(app)

# Set desired difficulty
blockchain = Blockchain(difficulty=4)

@app.route('/api/blockchain', methods=['GET'])
def get_chain():
    response = {
        'chain': blockchain.get_chain_data(),
        'length': len(blockchain.chain),
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
        print("Mining new block...")
        # add_block now performs PoW
        new_block = blockchain.add_block(block_data)
        print("Mining complete.")
        response = {
            'message': "New Block Forged",
            'block': new_block.to_dict(),
            'chain': blockchain.get_chain_data() # Send updated chain
        }
        return jsonify(response), 201
    except Exception as e:
        print(f"Error during mining: {e}")
        # It's often better not to expose raw exception details to the client
        return jsonify({'message': 'Internal server error during mining'}), 500


@app.route('/api/validate', methods=['GET'])
def validate_chain():
    is_valid = blockchain.is_chain_valid()
    status_code = 200 if is_valid else 400 # Use 400 Bad Request if invalid? Or just 200 OK? 200 is fine.
    response = {
        'message': 'Chain is valid' if is_valid else 'Chain is invalid!',
        'is_valid': is_valid
    }
    print(f"Validation requested. Result: {is_valid}") # Log validation result
    return jsonify(response), status_code


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)