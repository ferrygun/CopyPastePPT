import io
import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import numpy as np
import time
from datetime import datetime

import logging
import argparse
import requests

parser = argparse.ArgumentParser()
parser.add_argument('--basnet_service_ip', required=True, help="The BASNet service IP address")
args = parser.parse_args()

# Initialize the Flask application.
app = Flask(__name__)
CORS(app)

# Simple probe.
@app.route('/', methods=['GET'])
def hello():
    return 'Hello AR Cut Paste!'

# Ping to wake up the BASNet service.
@app.route('/ping', methods=['GET'])
def ping():
    logging.info('ping')
    r = requests.get(args.basnet_service_ip)
    logging.info(f'pong: {r.status_code} {r.content}')
    return 'pong'


# The paste endpoints handles new paste requests.
@app.route('/cut', methods=['POST'])
def paste():
	start = time.time()
	logging.info(' CUT')
	print("here")

	# Convert string of image data to uint8.
	print(request.files)
	if 'data' not in request.files:
		return jsonify({
			'status': 'error',
			'error': 'missing file param `data`'
		}), 400
	data = request.files['data'].read()
	if len(data) == 0:
		return jsonify({'status:': 'error', 'error': 'empty image'}), 400


	# Save debug locally.
	with open('imgtmp.jpg', 'wb') as f:
		f.write(data)

	image = Image.open("imgtmp.jpg")
	print(image.size)

	files= {'data': open('imgtmp.jpg', 'rb')}
	headers = {}
	res = requests.post(args.basnet_service_ip, headers=headers, files=files )

	# Save mask locally.
	logging.info(' > saving results...')
	with open('cut_mask.png', 'wb') as f:
		f.write(res.content)

	#logging.info(' > opening mask...')
	mask = Image.open('cut_mask.png').convert("L")
	print(mask.size[0])
	# Convert string data to PIL Image.
	logging.info(' > compositing final image...')
	ref = Image.open(io.BytesIO(data)).resize((mask.size[0],mask.size[1]))
	empty = Image.new("RGBA", ref.size, 0)
	img = Image.composite(ref, empty, mask)

	# TODO: currently hack to manually scale up the images. Ideally this would
	# be done respective to the view distance from the screen.
	img_scaled = img.resize((img.size[0] * 3, img.size[1] * 3))

	# Save locally.
	logging.info(' > saving final image...')
	img_scaled.save('cut_current.png')
	img.save('cut_current1.png')

	# Save to buffer
	buff = io.BytesIO()
	img.save(buff, 'PNG')
	buff.seek(0)

	return send_file(buff, mimetype='image/png')
	

if __name__ == '__main__':
    os.environ['FLASK_ENV'] = 'development'
    port = int(os.environ.get('PORT', 8081))
    app.run(debug=True, host='0.0.0.0', port=port)
