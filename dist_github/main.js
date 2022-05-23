(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["sframe"] = factory();
	else
		root["sframe"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./Client.js":
/*!*******************!*\
  !*** ./Client.js ***!
  \*******************/
/*! exports provided: SFrame */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SFrame", function() { return SFrame; });
/* harmony import */ var _Worker_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Worker.js */ "./Worker.js");


/**
 * SFrame library
 *  @namespace Sframe
 */
const SFrame =
{
	/**
	 * Create a new SFrame client context.
	 *
	 * This method will create client which communicates with web worker in which the SFrame context will be executed.
	 * @memberof SFrame
	 * @param {Number} senderId - Numeric id for this sender.
	 * @param {Object} config - Congiguration parameters [Optional].
	 * @param {Boolean} config.skipVp8PayloadHeader - Sends the vp8 payload header in clear (Note: it will be applied to all video frames as encoded chunks does not contain codec info yet).
	 * @returns {Promise<Client>} Promise that resolves to the client object when the web worker is initialized.
	 */
	createClient : async function(senderId,config)
	{
		//Create client
		const client = new Client();
		//Init worker async
		await client.init(senderId, config);
		//Return client
		return client;
	}
};

async function transferKey(key)
{
	if (key instanceof CryptoKey && key.type=="private")
		return await crypto.subtle.exportKey("pkcs8", key);
	if (key instanceof CryptoKey)
		return await crypto.subtle.exportKey("raw", key);
	if (key instanceof Uint8Array)
		return key.buffer.slice(0);
	return key.slice(0);
}


/**
 * The SFrame client object which acts as a proxy for web worker context.
 */
class Client extends EventTarget
{
	/**
	 * @ignore
	 * @hideconstructor
	 * private constructor
	 */
	constructor()
	{
		 super();

		//Create new worker
		this.worker = new _Worker_js__WEBPACK_IMPORTED_MODULE_0__["default"]();

		//Cutrent transactions
		this.transId = 1;
		this.transactions = new Map();

		//Listen for worker messages
		this.worker.addEventListener("message",async (event)=>{
			//Get data
			const data = event.data;
			//If it is a transaction response
			if (data.transId)
			{
				//Get transaction
				const transaction = this.transactions.get(data.transId);
				//Delete transaction
				this.transactions.delete(data.transId);
				//Check result
				if (data.error)
				    //Reject with error
					transaction.reject(new Error(data.error));
				else
					//Resolve promise
					transaction.resolve(data.result);
			} else if (data.event) {
				/**
				* The authenticated event will be fired when a new sender is received on the receiver.
				*
				* @name "authenticated"
				* @memberof Client
				* @kind event
				* @argument {String} id - The id for the associated RTCRtpReceiver
				* @argument {Number} senderId - The senderId of the authenticated sender received.
				*/
				//Create event
				const event = new Event(data.event.name);
				//Set id and senderId
				event.id	= data.event.data.id;
				event.senderId	= data.event.data.senderId;
				//Disptach event
				this.dispatchEvent(event);
			}
		});
		//Private method
		this.postMessage = (cmd, args, transferList)=>{
			//Create new promise
			return new Promise((resolve,reject)=>{
				//Get new transaction
				const transId = this.transId++;
				//Sent to worker
				this.worker.postMessage({transId,cmd,args},transferList);
				//Add it to pending transactions
				this.transactions.set(transId,{resolve,reject});
			});
		};
	}

	async init(senderId, config)
	{
		return this.postMessage("init", {senderId, config});
	}

	/**
	 * Set the sender encryption key.
	 *
	 * @param {ArrayBuffer|Uint8Array|CryptoKey} key - 32 bytes encryption key. If the value is a CryptoKey the algorithm must be "HKDF".
	 * @returns {Promise<void>} Promise which will be resolved when the key is set on the web worker.
	 */
	async setSenderEncryptionKey(key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setSenderEncryptionKey", [transfered], [transfered]);
	}

	/**
	 * Ratchert the sender encryption key.
	 *
	 * @returns {Promise<void>} Promise which will be resolved when the key is ratcheted on the web worker.
	 */
	async ratchetSenderEncryptionKey()
	{
		return this.postMessage("ratchetSenderEncryptionKey");
	}

	/**
	 * Set the sender signing key.
	 *
	 * @param {ArrayBuffer|Uint8Array|CryptoKey} key - Private key used for singing. If the value is a CryptoKey the algorithm must be "ECDSA".
	 * @returns {Promise<void>} Promise which will be resolved when the signing key is set on the web worker.
	 */
	async setSenderSigningKey(key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setSenderSigningKey", [transfered]);
	}

	/**
	 * Add receiver for a remote sender.
	 *
	 * @param {Number} receiverkKeyId - The remote senderId.
	 * @returns {Promise<void>} Promise which will be resolved when the receiver is added on the web worker.
	 */
	async addReceiver(receiverkKeyId)
	{
		return this.postMessage("addReceiver", [receiverkKeyId]);
	}

	/**
	 * Set the receiver encryption key associated to a remote sender.
	 *
	 * @param {Number} receiverkKeyId - The remote senderId.
	 * @param {ArrayBuffer|Uint8Array|CryptoKey} key - 32 bytes encryption key. If the value is a CryptoKey the algorithm must be "HKDF".
	 * @returns {Promise<void>} Promise which will be resolved when the key is set on the web worker.
	 */
	async setReceiverEncryptionKey(receiverkKeyId,key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setReceiverEncryptionKey", [receiverkKeyId, transfered], [transfered]);
	}

	/**
	 * Set the receiver signing key associated to a remote sender.
	 *
	 * @param {Number} receiverkKeyId - The remote senderId.
	 * @param {ArrayBuffer|Uint8Array|CryptoKey} key - Private key used for singing. If the value is a CryptoKey the algorithm must be "ECDSA".
	 * @returns {Promise<void>} Promise which will be resolved when the signing key is set on the web worker.
	 */
	async setReceiverVerifyKey(receiverkKeyId,key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setReceiverVerifyKey", [receiverkKeyId, transfered], [transfered]);
	}

	/**
	 * Remove receiver for a remote sender.
	 *
	 * @param {Number} receiverkKeyId - The remote senderId.
	 * @returns {Promise<void>} Promise which will be resolved when the receiver is removed on the web worker.
	 */
	deleteReceiver(receiverkKeyId)
	{
		return this.postMessage("deleteReceiver", [receiverkKeyId]);
	}

	/**
	 * Encrypt frames for a RTCRtpSender.
	 *
	 * @param {String} id - An unique identifier associated to this sender (for example transceiver.mid).
	 * @param {RTCRtpSender} sender - The sender object, associated track must be not null.
	 */
	async encrypt(id,sender)
	{
		 //We need the media kind until it is set as metadata on the chunk frame
		const kind = sender.track.kind;
		//Get the sender insertable streams
		const {readable: readableStream, writable: writableStream} = sender.createEncodedStreams ? sender.createEncodedStreams() :
			sender.createEncodedVideoStreams ? sender.createEncodedVideoStreams() : sender.createEncodedAudioStreams();
		//Pass to worker
		return this.postMessage("encrypt",
			{id, kind, readableStream, writableStream},
			[readableStream, writableStream]
		);
	}

	/**
	 * Decrypt frames fpr a RTCPRtpReceiver.
	 *
	 * @param {String} id - An unique identifier associated to this sender (for example transceiver.mid), it will be used for the authentication and signing events.
	 * @param {RTCRtpReceiver} receiver - The receiver object.
	 */
	async decrypt(id,receiver)
	{
		//We need the media kind until it is set as metadata on the chunk frame
		const kind = receiver.track.kind;
		//Get the receiver insertable streams
		const {readable: readableStream, writable: writableStream} = receiver.createEncodedStreams ? receiver.createEncodedStreams() :
			receiver.createEncodedVideoStreams ? receiver.createEncodedVideoStreams() : receiver.createEncodedAudioStreams();
		//Pass to worker
		return this.postMessage("decrypt",
			{id, kind, readableStream, writableStream},
			[readableStream, writableStream]
		);
	}

	/**
	 * Close client and terminate web worker.
	 */
	close()
	{
		//Terminate worker
		this.worker.terminate();

		//End all pending transactions
		for (let transaction of this.transactions.values())
			//Reject with terminated error
			transaction.reject(new Error("Client closed"));
		//Clear transactions
		this.transactions.clear();
	}
};


/***/ }),

/***/ "./Worker.js":
/*!*******************!*\
  !*** ./Worker.js ***!
  \*******************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Worker_fn; });
/* harmony import */ var _node_modules_worker_loader_dist_runtime_inline_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !./node_modules/worker-loader/dist/runtime/inline.js */ "./node_modules/worker-loader/dist/runtime/inline.js");
/* harmony import */ var _node_modules_worker_loader_dist_runtime_inline_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_worker_loader_dist_runtime_inline_js__WEBPACK_IMPORTED_MODULE_0__);



function Worker_fn() {
  return _node_modules_worker_loader_dist_runtime_inline_js__WEBPACK_IMPORTED_MODULE_0___default()("/******/ (function(modules) { // webpackBootstrap\n/******/ \t// The module cache\n/******/ \tvar installedModules = {};\n/******/\n/******/ \t// The require function\n/******/ \tfunction __webpack_require__(moduleId) {\n/******/\n/******/ \t\t// Check if module is in cache\n/******/ \t\tif(installedModules[moduleId]) {\n/******/ \t\t\treturn installedModules[moduleId].exports;\n/******/ \t\t}\n/******/ \t\t// Create a new module (and put it into the cache)\n/******/ \t\tvar module = installedModules[moduleId] = {\n/******/ \t\t\ti: moduleId,\n/******/ \t\t\tl: false,\n/******/ \t\t\texports: {}\n/******/ \t\t};\n/******/\n/******/ \t\t// Execute the module function\n/******/ \t\tmodules[moduleId].call(module.exports, module, module.exports, __webpack_require__);\n/******/\n/******/ \t\t// Flag the module as loaded\n/******/ \t\tmodule.l = true;\n/******/\n/******/ \t\t// Return the exports of the module\n/******/ \t\treturn module.exports;\n/******/ \t}\n/******/\n/******/\n/******/ \t// expose the modules object (__webpack_modules__)\n/******/ \t__webpack_require__.m = modules;\n/******/\n/******/ \t// expose the module cache\n/******/ \t__webpack_require__.c = installedModules;\n/******/\n/******/ \t// define getter function for harmony exports\n/******/ \t__webpack_require__.d = function(exports, name, getter) {\n/******/ \t\tif(!__webpack_require__.o(exports, name)) {\n/******/ \t\t\tObject.defineProperty(exports, name, { enumerable: true, get: getter });\n/******/ \t\t}\n/******/ \t};\n/******/\n/******/ \t// define __esModule on exports\n/******/ \t__webpack_require__.r = function(exports) {\n/******/ \t\tif(typeof Symbol !== 'undefined' && Symbol.toStringTag) {\n/******/ \t\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });\n/******/ \t\t}\n/******/ \t\tObject.defineProperty(exports, '__esModule', { value: true });\n/******/ \t};\n/******/\n/******/ \t// create a fake namespace object\n/******/ \t// mode & 1: value is a module id, require it\n/******/ \t// mode & 2: merge all properties of value into the ns\n/******/ \t// mode & 4: return value when already ns object\n/******/ \t// mode & 8|1: behave like require\n/******/ \t__webpack_require__.t = function(value, mode) {\n/******/ \t\tif(mode & 1) value = __webpack_require__(value);\n/******/ \t\tif(mode & 8) return value;\n/******/ \t\tif((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;\n/******/ \t\tvar ns = Object.create(null);\n/******/ \t\t__webpack_require__.r(ns);\n/******/ \t\tObject.defineProperty(ns, 'default', { enumerable: true, value: value });\n/******/ \t\tif(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));\n/******/ \t\treturn ns;\n/******/ \t};\n/******/\n/******/ \t// getDefaultExport function for compatibility with non-harmony modules\n/******/ \t__webpack_require__.n = function(module) {\n/******/ \t\tvar getter = module && module.__esModule ?\n/******/ \t\t\tfunction getDefault() { return module['default']; } :\n/******/ \t\t\tfunction getModuleExports() { return module; };\n/******/ \t\t__webpack_require__.d(getter, 'a', getter);\n/******/ \t\treturn getter;\n/******/ \t};\n/******/\n/******/ \t// Object.prototype.hasOwnProperty.call\n/******/ \t__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };\n/******/\n/******/ \t// __webpack_public_path__\n/******/ \t__webpack_require__.p = \"\";\n/******/\n/******/\n/******/ \t// Load entry module and return exports\n/******/ \treturn __webpack_require__(__webpack_require__.s = \"./Worker.js\");\n/******/ })\n/************************************************************************/\n/******/ ({\n\n/***/ \"./Worker.js\":\n/*!*******************!*\\\n  !*** ./Worker.js ***!\n  \\*******************/\n/*! no exports provided */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var lodash_debounce__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash/debounce */ \"./node_modules/lodash/debounce.js\");\n/* harmony import */ var lodash_debounce__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash_debounce__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _lib_Context_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./lib/Context.js */ \"./lib/Context.js\");\n/* harmony import */ var _lib_VP8PayloadHeader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lib/VP8PayloadHeader.js */ \"./lib/VP8PayloadHeader.js\");\n/* harmony import */ var _lib_Utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./lib/Utils.js */ \"./lib/Utils.js\");\n/* harmony import */ var _lib_TaskQueue_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./lib/TaskQueue.js */ \"./lib/TaskQueue.js\");\n\n\n\n\n\n\nconst postDecryptStatusMessage = lodash_debounce__WEBPACK_IMPORTED_MODULE_0___default()((message) => {\n\tpostMessage(message)\n},  1000, { leading: false, trailing: true });\n\nlet context; \n\nonmessage = async (event) => {\n\t//Get data\n\tconst {transId,cmd,args} = event.data;\n\t\n\ttry {\n\t\tlet result = true;\n\t\t\n\t\t//Depending on the cmd\n\t\tswitch(event.data.cmd)\n\t\t{\n\t\t\tcase \"init\":\n\t\t\t{\n\t\t\t\t//Get info\n\t\t\t\tconst {senderId, config} = args;\n\t\t\t\t//Crate context\n\t\t\t\tcontext = new _lib_Context_js__WEBPACK_IMPORTED_MODULE_1__[\"Context\"](senderId, config);\n\t\t\t\tbreak;\n\t\t\t}\n\t\t\tcase \"encrypt\":\n\t\t\t{\n\t\t\t\t//The recrypt queue\n\t\t\t\tconst tasks = new _lib_TaskQueue_js__WEBPACK_IMPORTED_MODULE_4__[\"TaskQueue\"]();\n\t\t\t\t//Get event data\n\t\t\t\tconst{id, kind, readableStream, writableStream} = args;\n\t\t\t\t//Create transform stream foo encrypting\n\t\t\t\tconst transformStream = new TransformStream({\n\t\t\t\t\ttransform: async (chunk, controller)=>{\n\t\t\t\t\t\t//Nothing in clear\n\t\t\t\t\t\tlet skip = 0;\n\t\t\t\t\t\t//Check if it is video and we are skipping vp8 payload header\n\t\t\t\t\t\tif (kind==\"video\" && context.isSkippingVp8PayloadHeader())\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t//Get VP8 header\n\t\t\t\t\t\t\tconst vp8 = _lib_VP8PayloadHeader_js__WEBPACK_IMPORTED_MODULE_2__[\"VP8PayloadHeader\"].parse(chunk.data);\n\t\t\t\t\t\t\t//Skip it\n\t\t\t\t\t\t\tskip = vp8.byteLength;\n\t\t\t\t\t\t}\n\t\t\t\t\t\t//Enqueue task\n\t\t\t\t\t\ttasks.enqueue (\n\t\t\t\t\t\t\tcontext.encrypt(kind, id, chunk.data, skip),\n\t\t\t\t\t\t\t(encrypted) => {\n\t\t\t\t\t\t\t\t//Set back encrypted payload\n\t\t\t\t\t\t\t\tchunk.data = encrypted.buffer;\n\t\t\t\t\t\t\t\t//write back\n\t\t\t\t\t\t\t\tcontroller.enqueue(chunk);\n\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t(error)=>{\n\t\t\t\t\t\t\t\t//TODO: handle errors\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t);\n\t\t\t\t\t}\n\t\t\t\t});\n\t\t\t\t//Encrypt\n\t\t\t\treadableStream\n\t\t\t\t\t.pipeThrough(transformStream)\n\t\t\t\t\t.pipeTo(writableStream);\n\t\t\t\tbreak;\n\t\t\t}\n\t\t\tcase \"decrypt\":\n\t\t\t{\n\t\t\t\t//The recrypt queue\n\t\t\t\tconst tasks = new _lib_TaskQueue_js__WEBPACK_IMPORTED_MODULE_4__[\"TaskQueue\"]();\n\t\t\t\t//Last reveiced senderId\n\t\t\t\tlet senderId = -1;\n\t\t\t\t//Get event data\n\t\t\t\tconst{id, kind, readableStream, writableStream} = args;\n\t\t\t\t//Create transform stream for encrypting\n\t\t\t\tconst transformStream = new TransformStream({\n\t\t\t\t\ttransform: async (chunk, controller)=>{\n\t\t\t\t\t\t//Nothing in clear\n\t\t\t\t\t\tlet skip = 0;\n\t\t\t\t\t\t//Check if it is video and we are skipping vp8 payload header\n\t\t\t\t\t\tif (kind==\"video\" && context.isSkippingVp8PayloadHeader())\n\t\t\t\t\t\t{\n\t\t\t\t\t\t\t//Get VP8 header\n\t\t\t\t\t\t\tconst vp8 = _lib_VP8PayloadHeader_js__WEBPACK_IMPORTED_MODULE_2__[\"VP8PayloadHeader\"].parse(chunk.data);\n\t\t\t\t\t\t\t//Skip it\n\t\t\t\t\t\t\tskip = vp8.byteLength;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\t//Enqueue task\n\t\t\t\t\t\ttasks.enqueue(\n\t\t\t\t\t\t\tcontext.decrypt(kind, id, chunk.data, skip),\n\t\t\t\t\t\t\t(decrypted) => {\n\t\t\t\t\t\t\t\t//Set back decrypted payload\n\t\t\t\t\t\t\t\tchunk.data = decrypted.buffer;\n\t\t\t\t\t\t\t\t//write back\n\t\t\t\t\t\t\t\tcontroller.enqueue(chunk);\n\t\t\t\t\t\t\t\t//If it is a sender\n\t\t\t\t\t\t\t\tif (decrypted.senderId!=senderId)\n\t\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t\t//Store it\n\t\t\t\t\t\t\t\t\tsenderId = decrypted.senderId;\n\t\t\t\t\t\t\t\t\t//Launch event\n\t\t\t\t\t\t\t\t\tpostMessage ({event: {\n\t\t\t\t\t\t\t\t\t\tname\t: \"authenticated\",\n\t\t\t\t\t\t\t\t\t\tdata\t: {\n\t\t\t\t\t\t\t\t\t\t\tid\t : id,\n\t\t\t\t\t\t\t\t\t\t\tsenderId : senderId\n\t\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t\t}});\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tif (decrypted.decryptionRestored) {\n\t\t\t\t\t\t\t\t\tpostDecryptStatusMessage({\n\t\t\t\t\t\t\t\t\t\tevent: {\n\t\t\t\t\t\t\t\t\t\t\tname: \"decryptionRestored\",\n\t\t\t\t\t\t\t\t\t\t\tdata: {\n\t\t\t\t\t\t\t\t\t\t\t\tid,\n\t\t\t\t\t\t\t\t\t\t\t\tsenderId,\n\t\t\t\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t\t});\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t(error) => {\n\t\t\t\t\t\t\t\tif (error.message === 'decryptFailed') {\n\t\t\t\t\t\t\t\t\tpostDecryptStatusMessage({\n\t\t\t\t\t\t\t\t\t\tevent: {\n\t\t\t\t\t\t\t\t\t\t\tname: \"decryptFailed\",\n\t\t\t\t\t\t\t\t\t\t\tdata: {\n\t\t\t\t\t\t\t\t\t\t\t\tid,\n\t\t\t\t\t\t\t\t\t\t\t\tsenderId,\n\t\t\t\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t});\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t);\n\t\t\t\t\t}\n\t\t\t\t});\n\t\t\t\t//Decrypt\n\t\t\t\treadableStream\n\t\t\t\t\t.pipeThrough(transformStream)\n\t\t\t\t\t.pipeTo(writableStream);\n\t\t\t\tbreak;\n\t\t\t}\n\t\t\tdefault:\n\t\t\t\t//Excute \"cmd\" method on context\n\t\t\t\tresult = await context[cmd](...args || []);\n\t\t}\n\t\t//Send result back\n\t\tpostMessage ({transId,result});\n\t} catch (error) {\n\t\tconsole.error(error);\n\t\t//Send error back\n\t\tpostMessage({transId,error});\n\t}\n};\n\n\n/***/ }),\n\n/***/ \"./lib/AesCm128HmacSha256EncryptionKey.js\":\n/*!************************************************!*\\\n  !*** ./lib/AesCm128HmacSha256EncryptionKey.js ***!\n  \\************************************************/\n/*! exports provided: AesCm128HmacSha256EncryptionKey */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"AesCm128HmacSha256EncryptionKey\", function() { return AesCm128HmacSha256EncryptionKey; });\n/* harmony import */ var _Utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Utils.js */ \"./lib/Utils.js\");\n/* harmony import */ var _Salts_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Salts.js */ \"./lib/Salts.js\");\n/* harmony import */ var _IV_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./IV.js */ \"./lib/IV.js\");\n\n\n\n\nconst ratchetKey = (key) => \n\tcrypto.subtle.deriveBits(\n\t\t{\n\t\t\tname : \"HKDF\",\n\t\t\thash : \"SHA-256\",\n\t\t\tsalt : _Salts_js__WEBPACK_IMPORTED_MODULE_1__[\"Salts\"].RatchetKey,\n\t\t\tinfo : new ArrayBuffer()\n\t\t},\n\t\tkey,\n\t\t256\n\t);\n\nclass AesCm128HmacSha256EncryptionKey \n{\n\tconstructor(){\n\t\tthis.ratchets = [];\n\t}\n\n\tasync setKey(key)\n\t{\n\t\tif (key instanceof CryptoKey)\n\t\t{\n\t\t\t//Check private key algorithm\n\t\t\tif (key.algorithm.name!=\"HKDF\")\n\t\t\t\t//Error\n\t\t\t\tthrow new Error(\"Invalid key\");\n\t\t} else {\n\t\t\t//Import key\n\t\t\tkey = await crypto.subtle.importKey(\n\t\t\t\t\"raw\",\n\t\t\t\tkey,\n\t\t\t\t\"HKDF\",\n\t\t\t\tfalse,\n\t\t\t\t[\"deriveBits\", \"deriveKey\"]\n\t\t\t);\n\t\t}\n\t\tthis.key = key;\n\t\t\n\t\t//Get salt key\n\t\tthis.saltKey = new Uint8Array(await crypto.subtle.deriveBits(\n\t\t\t{\n\t\t\t\tname : \"HKDF\",\n\t\t\t\thash : \"SHA-256\",\n\t\t\t\tsalt : _Salts_js__WEBPACK_IMPORTED_MODULE_1__[\"Salts\"].SaltKey,\n\t\t\t\tinfo : new ArrayBuffer()\n\t\t\t},\n\t\t\tkey,\n\t\t\t128\n\t\t));\n\t\n\t\t//Get encryption key\n\t\tthis.encryptionKey = await crypto.subtle.deriveKey(\n\t\t\t{\n\t\t\t\tname : \"HKDF\",\n\t\t\t\thash : \"SHA-256\",\n\t\t\t\tsalt : _Salts_js__WEBPACK_IMPORTED_MODULE_1__[\"Salts\"].EncryptionKey,\n\t\t\t\tinfo : new ArrayBuffer()\n\t\t\t},\n\t\t\tkey,\n\t\t\t{\n\t\t\t\tname : \"AES-CTR\",\n\t\t\t\tlength : 128\n\t\t\t},\n\t\t\tfalse,\n\t\t\t[\"encrypt\",\"decrypt\"]\n\t\t);\n\t\n\t\t//Get authentication key\n\t\tthis.authKey = await crypto.subtle.deriveKey(\n\t\t\t{\n\t\t\t\tname : \"HKDF\",\n\t\t\t\thash : \"SHA-256\",\n\t\t\t\tsalt : _Salts_js__WEBPACK_IMPORTED_MODULE_1__[\"Salts\"].AuthenticationKey,\n\t\t\t\tinfo : new ArrayBuffer()\n\t\t\t},\n\t\t\tkey,\n\t\t\t{\n\t\t\t\tname : \"HMAC\",\n\t\t\t\thash : \"SHA-256\",\n\t\t\t\tlength : 256\n\t\t\t},\n\t\t\tfalse,\n\t\t\t[\"sign\",\"verify\"]\n\t\t);\n\t}\n\n\t\n\tasync encrypt(type,header,payload,extraBytes,skip)\n\t{\n\t\t//Encure int\n\t\tskip = skip ? skip : 0;\n\t\t\n\t\t//Create IV\n\t\tconst iv = _IV_js__WEBPACK_IMPORTED_MODULE_2__[\"IV\"].generate(header.keyId, header.counter, this.saltKey);\n\t\t\n\t\t//Encrypt\n\t\tconst encrypted = await crypto.subtle.encrypt(\n\t\t\t{\n\t\t\t\tname\t: \"AES-CTR\",\n\t\t\t\tcounter : iv,\n\t\t\t\tlength  : 128\n\t\t\t},\n\t\t\tthis.encryptionKey,\n\t\t\tpayload\n\t\t);\n\t\n\t\t//Get auth tag length from media type\n\t\tconst authTagLength = AesCm128HmacSha256EncryptionKey.getAuthTagLen(type);\n\t\t\n\t\t//Create encrypted frame\n\t\tconst encryptedFrame = new Uint8Array(header.byteLength + payload.byteLength + authTagLength + extraBytes + skip);\n\t\t\n\t\t//Set header and encrypted payolad\n\t\tencryptedFrame.set(header, skip);\n\t\tencryptedFrame.set(new Uint8Array(encrypted), skip + header.length);\n\t\t\n\t\t//Authenticate\n\t\tconst signature = new Uint8Array(await crypto.subtle.sign(\n\t\t\t\"HMAC\",\n\t\t\tthis.authKey, \n\t\t\tencryptedFrame.subarray(skip, skip + header.byteLength + encrypted.byteLength)\n\t\t));\n\t\n\t\t//Truncate\n\t\tconst authTag = signature.subarray(0, authTagLength);\n\t\n\t\t//Append authentication tag\n\t\tencryptedFrame.set(authTag, skip + encrypted.byteLength + header.byteLength );\n\t\t\n\t\t//Done\n\t\treturn [encryptedFrame,authTag];\n\t\t\n\t}\n\t\n\tasync decrypt(type, header, encryptedFrame, extrabytes, skip)\n\t{\n\t\t//Encure int\n\t\tskip = skip ? skip : 0;\n\t\t\n\t\t//Create IV\n\t\tconst iv = _IV_js__WEBPACK_IMPORTED_MODULE_2__[\"IV\"].generate(header.keyId, header.counter, this.saltKey);\n\t\t\n\t\t//Get auth tag length from media type\n\t\tconst authTagLength = AesCm128HmacSha256EncryptionKey.getAuthTagLen(type);\n\t\t\n\t\t//Get encrypted frame length (without extra bytes from signature)\n\t\tconst frameLength = encryptedFrame.byteLength - extrabytes - skip;\n\t\t\n\t\t//Get authentication tag\n\t\tconst authTag = encryptedFrame.subarray(skip + frameLength - authTagLength, skip + frameLength);\n\t\t\n\t\t//Get encrypted payload\n\t\tconst encrypted = encryptedFrame.subarray(skip + header.byteLength, skip + frameLength - authTagLength);\n\t\t\n\t\t//Calculate signature\n\t\tconst signature = new Uint8Array(await crypto.subtle.sign(\n\t\t\t\"HMAC\",\n\t\t\tthis.authKey, \n\t\t\tencryptedFrame.subarray(skip, skip + header.byteLength + encrypted.byteLength)\n\t\t));\n\t\n\t\t//Authenticate authTag\n\t\tlet authenticated = true;\n\t\t//Avoid timimg attacks by iterating over all bytes\n\t\tfor (let i=0;i<authTagLength;++i)\n\t\t\t//check signature\n\t\t\tauthenticated &= authTag[i]===signature[i];\n\t\t\n\t\t//If not all where equal\n\t\tif (!authenticated)\n\t\t\t//Authentication error\n\t\t\tthrow new Error(\"Authentication error\");\n\t\t\n\t\t//Decrypt\n\t\tconst payload = new Uint8Array (await crypto.subtle.decrypt(\n\t\t\t{\n\t\t\t\tname\t: \"AES-CTR\",\n\t\t\t\tcounter : iv,\n\t\t\t\tlength  : 128\n\t\t\t},\n\t\t\tthis.encryptionKey,\n\t\t\tencrypted\n\t\t));\n\t\t\n\t\t//Done\n\t\treturn [payload, authTag];\n\t}\n\t\n\tasync ratchet(index)\n\t{\n\t\t// return stored key if exists\n\t\tif (this.ratchets[index]) {\n\t\t\treturn this.ratchets[index];\n\t\t}\n\t\t\n\t\t//Create new key\n\t\tconst key = new AesCm128HmacSha256EncryptionKey();\n\n\t\t// Get previous ratchet\n\t\tconst previousRatchetKey = index === 0 ? this.key : this.ratchets[index - 1].key;\n\t\t\n\t\t//Set ratchet key\n\t\tawait key.setKey(await ratchetKey(previousRatchetKey));\n\t\t\n\t\tthis.ratchets[index] = key;\n\t\t//Done\n\t\treturn key;\n\t}\n\t\n\tstatic getAuthTagLen(type)\n\t{\n\t\treturn type.toLowerCase()===\"video\" ? 10 : 4;\n\t};\n\t\n\tstatic async create(raw) \n\t{\n\t\t//Create new key\n\t\tconst key = new AesCm128HmacSha256EncryptionKey();\n\t\t//Set raw key\n\t\tawait key.setKey(raw);\n\t\t//Done\n\t\treturn key;\n\t}\n};\n\n\n\n/***/ }),\n\n/***/ \"./lib/Context.js\":\n/*!************************!*\\\n  !*** ./lib/Context.js ***!\n  \\************************/\n/*! exports provided: Context */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Context\", function() { return Context; });\n/* harmony import */ var _Header_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Header.js */ \"./lib/Header.js\");\n/* harmony import */ var _Sender_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Sender.js */ \"./lib/Sender.js\");\n/* harmony import */ var _Receiver_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Receiver.js */ \"./lib/Receiver.js\");\n\n\n\n\nclass Context\n{\n\t\n\tconstructor(senderId, config)\n\t{\n\t\t//Store config\n\t\tthis.config = Object.assign({}, config);\n\t\t//Only one sender per context\n\t\tthis.sender = new _Sender_js__WEBPACK_IMPORTED_MODULE_1__[\"Sender\"](senderId);\n\t\t\n\t\t//The map of known remote senders\n\t\tthis.receivers = new Map();\n\t}\n\t\n\tisSkippingVp8PayloadHeader()\n\t{\n\t\treturn !!this.config.skipVp8PayloadHeader;\n\t}\n\t\t\n\tasync setSenderEncryptionKey(key)\n\t{\n\t\t//Set it\n\t\treturn this.sender.setEncryptionKey(key);\n\t}\n\t\n\tasync ratchetSenderEncryptionKey()\n\t{\n\t\t//Set it\n\t\treturn this.sender.ratchetEncryptionKey();\n\t}\n\t\n\tasync setSenderSigningKey(key)\n\t{\n\t\t//Set it\n\t\treturn this.sender.setSigningKey(key);\n\t}\n\t\n\taddReceiver(receiverkKeyId)\n\t{\n\t\t//Check we don't have a receiver already for that id\n\t\tif(this.receivers.has(receiverkKeyId))\n\t\t\t//Error\n\t\t\tthrow new Error(\"There was already a receiver for keyId \"+receiverkKeyId);\n\t\t//Add new\n\t\tthis.receivers.set(receiverkKeyId, new _Receiver_js__WEBPACK_IMPORTED_MODULE_2__[\"Receiver\"](receiverkKeyId));\n\t}\n\t\n\tasync setReceiverEncryptionKey(receiverkKeyId, key)\n\t{\n\t\t//Get receiver for the sender\n\t\tconst receiver = this.receivers.get(receiverkKeyId);\n\t\t\n\t\t//IF not found\n\t\tif (!receiver)\n\t\t\t//Error\n\t\t\tthrow new Error(\"No receiver found for keyId \"+receiverkKeyId);\n\t\t\n\t\t//Rachet\n\t\treturn receiver.setEncryptionKey(key);\n\t}\n\t\n\tasync setReceiverVerifyKey(receiverkKeyId,key)\n\t{\n\t\t//Get receiver for the sender\n\t\tconst receiver = this.receivers.get(receiverkKeyId);\n\t\t\n\t\t//IF not found\n\t\tif (!receiver)\n\t\t\t//Error\n\t\t\tthrow new Error(\"No receiver found for keyId \"+receiverkKeyId);\n\t\t\n\t\t//Rachet\n\t\treturn receiver.setVerifyKey(key);\n\t}\n\t\n\tdeleteReceiver(receiverkKeyId)\n\t{\n\t\t//Delete receiver\n\t\treturn this.receivers.delete(receiverkKeyId);\n\t}\n\t\n\tasync encrypt(type, ssrcId, frame, skip)\n\t{\n\t\t//Encrypt it\n\t\treturn this.sender.encrypt(type, ssrcId, frame, skip);\n\t}\n\t\n\tasync decrypt(type, ssrcId, encryptedFrame, skip)\n\t{\n\t\t//convert if needed\n\t\tif (!(encryptedFrame instanceof Uint8Array))\n\t\t\tencryptedFrame = new Uint8Array (encryptedFrame);\n\t\t\n\t\t//Parse encrypted payload\n\t\tconst header = _Header_js__WEBPACK_IMPORTED_MODULE_0__[\"Header\"].parse(encryptedFrame.subarray(skip));\n\t\t\n\t\t//Get receiver for the sender\n\t\tconst receiver = this.receivers.get(header.keyId);\n\t\t\n\t\t//IF not found\n\t\tif (!receiver)\n\t\t\t//Error\n\t\t\tthrow new Error(\"No receiver found for keyId \" + header.keyId);\n\t\t\n\t\t//Decrypt it\n\t\treturn receiver.decrypt(type, ssrcId, header, encryptedFrame, skip);\n\t}\n\t\n};\n\n\n/***/ }),\n\n/***/ \"./lib/EcdsaSignKey.js\":\n/*!*****************************!*\\\n  !*** ./lib/EcdsaSignKey.js ***!\n  \\*****************************/\n/*! exports provided: EcdsaSignKey */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"EcdsaSignKey\", function() { return EcdsaSignKey; });\n//TODO: Update to Ed25519 when available\n// https://chromestatus.com/features/4913922408710144\n// https://chromium.googlesource.com/chromium/src/+log/master/components/webcrypto/algorithms/ed25519.cc\n\nclass EcdsaSignKey\n{\n\t\n\tasync setKey(privKey)\n\t{\n\t\t//If it is a crypto key already\n\t\tif (privKey instanceof CryptoKey)\n\t\t{\n\t\t\t//Check private key algorithm\n\t\t\tif (privKey.algorithm.name!=\"ECDSA\" || !privKey.usages.includes(\"sign\"))\n\t\t\t\t//Error\n\t\t\t\tthrow new Error(\"Invalid key\");\n\t\t\t//Set it\n\t\t\tthis.privKey = privKey;\n\t\t} else {\n\t\t\t//Import it\n\t\t\tthis.privKey = await crypto.subtle.importKey(\n\t\t\t\t\"pkcs8\",\n\t\t\t\tprivKey,\n\t\t\t\t{\n\t\t\t\t\tname\t\t: \"ECDSA\",\n\t\t\t\t\tnamedCurve\t: \"P-521\"\n\t\t\t\t},\n\t\t\t\tfalse,\n\t\t\t\t[\"sign\"]\n\t\t\t);\n\t\t}\n\t}\n\t\n\tasync sign(authTags)\n\t{\n\t\t//Verify\n\t\treturn new Uint8Array(await crypto.subtle.sign(\n\t\t\t{\n\t\t\t  name: \"ECDSA\",\n\t\t\t  hash: \"SHA-512\"\n\t\t\t},\n\t\t\tthis.privKey,\n\t\t\tauthTags\n\t\t));\n\t}\n\t\n\tstatic getSignatureLen()\n\t{\n\t\treturn 64;\n\t}\n\t\n\tstatic async create(privKey)\n\t{\n\t\t//Craete key\n\t\tconst key = new EcdsaSignKey();\n\t\t//Set key\n\t\tawait key.setKey(privKey);\n\t\t//Done\n\t\treturn key;\n\t\t\n\t}\n};\n\n\n/***/ }),\n\n/***/ \"./lib/EcdsaVerifyKey.js\":\n/*!*******************************!*\\\n  !*** ./lib/EcdsaVerifyKey.js ***!\n  \\*******************************/\n/*! exports provided: EcdsaVerifyKey */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"EcdsaVerifyKey\", function() { return EcdsaVerifyKey; });\n\nclass EcdsaVerifyKey\n{\n\tasync setKey(pubKey)\n\t{\n\t\t//If it is a crypto key already\n\t\tif (pubKey instanceof CryptoKey)\n\t\t{\n\t\t\t//Check \n\t\t\tif (pubKey.algorithm.name!=\"ECDSA\" || !pubKey.usages.includes(\"verify\"))\n\t\t\t\t//Error\n\t\t\t\tthrow new Error(\"Invalid key\");\n\t\t\t//Set it\n\t\t\tthis.pubKey = pubKey;\n\t\t} else {\n\t\t\t//Import it\n\t\t\tthis.pubKey = await crypto.subtle.importKey(\n\t\t\t\t\"raw\",\n\t\t\t\tpubKey,\n\t\t\t\t{\n\t\t\t\t\tname\t\t: \"ECDSA\",\n\t\t\t\t\tnamedCurve\t: \"P-521\"\n\t\t\t\t},\n\t\t\t\tfalse,\n\t\t\t\t[\"verify\"]\n\t\t\t);\n\t\t}\n\t}\n\t\n\tasync verify(signed,signature)\n\t{\n\t\t//Verify\n\t\treturn await window.crypto.subtle.verify(\n\t\t\t{\n\t\t\t\tname: \"ECDSA\",\n\t\t\t\thash: \"SHA-512\"\n\t\t\t},\n\t\t\tthis.pubKey,\n\t\t\tsignature,\n\t\t\tsigned\n\t\t);\n\t}\n\t\n\tstatic getSignatureLen()\n\t{\n\t\treturn 64;\n\t}\n\t\n\tstatic async create(pubKey)\n\t{\n\t\t//Craete key\n\t\tconst key = new EcdsaVerifyKey();\n\t\t//Set key\n\t\tawait key.setKey(pubKey);\n\t\t//Done\n\t\treturn key;\n\t\t\n\t}\n};\n\n\n/***/ }),\n\n/***/ \"./lib/Header.js\":\n/*!***********************!*\\\n  !*** ./lib/Header.js ***!\n  \\***********************/\n/*! exports provided: Header */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Header\", function() { return Header; });\n/*\n\t0 1 2 3 4 5 6 7\n\t+-+-+-+-+-+-+-+-+\n\t|S|LEN  |X|  K  |\n\t+-+-+-+-+-+-+-+-+\n\tSFrame header metadata\n\n\tSignature flag (S): 1 bit This field indicates the payload contains a signature of set. Counter Length (LEN): 3 bits This field indicates the length of the CTR fields in bytes. Extended Key Id Flag (X): 1 bit\n\tIndicates if the key field contains the key id or the key length. Key or Key Length: 3 bits This field contains the key id (KID) if the X flag is set to 0, or the key length (KLEN) if set to 1.\n\n\tIf X flag is 0 then the KID is in the range of 0-7 and the frame counter (CTR) is found in the next LEN bytes:\n\n\t 0 1 2 3 4 5 6 7\n\t+-+-+-+-+-+-+-+-+---------------------------------+\n\t|S|LEN  |0| KID |    CTR... (length=LEN)          |\n\t+-+-+-+-+-+-+-+-+---------------------------------+\n\tKey id (KID): 3 bits The key id (0-7). Frame counter (CTR): (Variable length) Frame counter value up to 8 bytes long.\n\n\tif X flag is 1 then KLEN is the length of the key (KID), that is found after the SFrame header metadata byte. After the key id (KID), the frame counter (CTR) will be found in the next LEN bytes:\n\n\t 0 1 2 3 4 5 6 7\n\t+-+-+-+-+-+-+-+-+---------------------------+---------------------------+\n\t|S|LEN  |1|KLEN |   KID... (length=KLEN)    |    CTR... (length=LEN)    |\n\t+-+-+-+-+-+-+-+-+---------------------------+---------------------------+\n*/\nconst Header = {\n\t\n\tparse : function(buffer) \n\t{\n\t\t//Create uint view\n\t\tconst view = new Uint8Array(buffer);\n\t\t\n\t\t//Get metadata\n\t\tconst metadata = view[0];\n\t\t\n\t\t//Get values\n\t\tconst s\t\t= !!(metadata & 0x80);\n\t\tconst len\t= (metadata >> 4) & 0x07;\n\t\tconst x\t\t= !!(metadata & 0x08);\n\t\tconst k\t\t= metadata & 0x07;\n\t\t\n\t\t//Get key id\n\t\tlet keyId = 0;\n\t\t//Check if it is the extented key format\n\t\tif (x)\n\t\t{\n\t\t\t//Read length\n\t\t\tfor (let i=0;i<k;i++)\n\t\t\t\tkeyId = (keyId * 256) + view[i+1];\n\t\t} else {\n\t\t\t//Short version\n\t\t\tkeyId = k;\n\t\t}\n\t\t\n\t\t//Get ctr\n\t\tconst ini = x ? k + 1 : 1;\n\t\tlet counter = 0;\n\t\t//Read length\n\t\tfor (let i=0;i<len;i++)\n\t\t\tcounter = (counter * 256) + view[ini+i];\n\t\t\n\t\t//Get header buffer view\n\t\tconst header = view.subarray(0, x ? k + len + 1 : len + 1);\n\t\t\n\t\t//Add parsed atributes\n\t\theader.signature   = s;\n\t\theader.keyId\t   = keyId;\n\t\theader.counter\t   = counter;\n\t\t\n\t\t//Done\n\t\treturn header; \n\t},\n\tgenerate: function(signature,keyId,counter)\n\t{\n\t\t//Check keyId\n\t\tHeader.checkKeyId(keyId);\n\t\t\n\t\t//Calcultate variavle length\n\t\tconst varlen = (x) => x ? parseInt(Math.log(x) / Math.log(256))+1 : 1;\n\t\t\n\t\t//Get key extension and length\n\t\tconst x = keyId > 7;\n\t\tconst k = x ? varlen(keyId) : keyId;\n\t\t\n\t\t//Get counter length\n\t\tconst len = varlen(counter);\n\t\t\n\t\t//Ensure counter is not huge\n\t\tif (len>7)\n\t\t\t//Error\n\t\t\tthrow new Error(\"Counter is too big\");\n\t\t\n\t\t//Generate header\n\t\tconst header = new Uint8Array( x ? 1 + k + len : 1 + len);\n\t\t\n\t\t//Set metadata header\n\t\theader[0] = !!signature;\n\t\theader[0] = header[0] << 3  | ( len & 0x07);\n\t\theader[0] = header[0] << 1  | x;\n\t\theader[0] = header[0] << 3  | ( k & 0x07);\n\t\t\n\t\t//Add parsed atributes\n\t\theader.signature   = !!signature;\n\t\theader.keyId\t   = keyId;\n\t\theader.counter\t   = counter;\n\t\t\n\t\t//If extended key\n\t\tif (x)\n\t\t\t//Add key id\n\t\t\tfor (let i=0; i<k; ++i)\n\t\t\t\theader[i+1] = (keyId >> (k-1-i)*8) & 0xff;\n\t\t//The coutner init\n\t\tconst ini = x ? k + 1 : 1;\n\t\t//Add counter\n\t\tfor (let i=0; i<len; ++i)\n\t\t\theader[ini+i] = (counter >> (len-1-i)*8) & 0xff;\n\t\t\t\n\t\t\n\t\t//Done\n\t\treturn header;\n\t}\n};\n\nHeader.MaxKeyId = 0xFFFFFFFFFF;\n\nHeader.checkKeyId = function(keyId)\n{\n\t//Check it is possitive\n\tif (keyId<0)\n\t\t//Error\n\t\tthrow new Error(\"keyId must be possitive\");\n\t//Check it is possitive\n\tif (keyId>Header.MaxKeyId)\n\t\t//Error\n\t\tthrow new Error(\"keyId must be 5 bytes long at most\");\n};\n\n\n/***/ }),\n\n/***/ \"./lib/IV.js\":\n/*!*******************!*\\\n  !*** ./lib/IV.js ***!\n  \\*******************/\n/*! exports provided: IV */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"IV\", function() { return IV; });\nconst IV = \n{\n\tgenerate : function(keyId,counter,salt)\n\t{\n\t\t//128 bits\n\t\tconst iv = new Uint8Array (16);\n\t\t//Get view\n\t\tconst view = new DataView(iv.buffer);\n\t\t//Set keyId\n\t\tview.setBigUint64(0, BigInt(counter));\n\t\t//Set coutner\n\t\tview.setBigUint64(8, BigInt(keyId));\n\t\t//Xor with salt key\n\t\tfor (let i=0; i<iv.byteLength; ++i)\n\t\t\t//xor\n\t\t\tview.setUint8(i,iv[i]^salt[i]); \n\t\t//return buffer\n\t\treturn iv;\n\t}\n};\n\n\n/***/ }),\n\n/***/ \"./lib/Receiver.js\":\n/*!*************************!*\\\n  !*** ./lib/Receiver.js ***!\n  \\*************************/\n/*! exports provided: Receiver */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Receiver\", function() { return Receiver; });\n/* harmony import */ var _Utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Utils.js */ \"./lib/Utils.js\");\n/* harmony import */ var _Header_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Header.js */ \"./lib/Header.js\");\n/* harmony import */ var _EcdsaVerifyKey_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./EcdsaVerifyKey.js */ \"./lib/EcdsaVerifyKey.js\");\n/* harmony import */ var _AesCm128HmacSha256EncryptionKey_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./AesCm128HmacSha256EncryptionKey.js */ \"./lib/AesCm128HmacSha256EncryptionKey.js\");\n\n\n\n\n\nconst MaxRatchetAttempts = 5;\nconst ReplayWindow = 128;\nconst KeyTimeout = 1000;\n\nclass Receiver\n{\n\tconstructor(senderId)\n\t{\n\t\t//Check keyId\n\t\t_Header_js__WEBPACK_IMPORTED_MODULE_1__[\"Header\"].checkKeyId(senderId);\n\t\t\n\t\t//Store sender id\n\t\tthis.senderId = senderId;\n\t\t//Last received counter\n\t\tthis.maxReceivedCounter = -1;\n\t\t//Number or ratchets of current key\n\t\tthis.numKeyRatchets = 0;\n\t\t//Create keyring\n\t\tthis.keyring = [];\n\t\t//Pending verified tags\n\t\tthis.pending = new Map();\n\t\t// has failed decryption\n\t\tthis.keyFailing = false;\n\n\t\t//Scheduled keys\n\t\tthis.scheduledKeys = new WeakSet ();\n\n\t\t//Function to clear up keys up to given one\n\t\tthis.schedulePreviousKeysTimeout = (key) =>{\n\t\t\t//If this is the only key\n\t\t\tif (this.keyring.length==1 && this.keyring[0]===key)\n\t\t\t\t//Do nothing\n\t\t\t\treturn;\n\t\t\t//If has been already scheduled\n\t\t\tif (this.scheduledKeys.has(key))\n\t\t\t\t//Not do it twice\n\t\t\t\treturn;\n\t\t\t//Add it\n\t\t\tthis.scheduledKeys.add(key);\n\t\t\t//Schedule key timeout of previous keys\n\t\t\tsetTimeout(()=>{\n\t\t\t\t//Find key index\n\t\t\t\tconst i = this.keyring.findIndex(k=>k===key);\n\t\t\t\t//Remove previous keys\n\t\t\t\tthis.keyring = this.keyring.splice(i);\n\t\t\t}, KeyTimeout);\n\t\t};\n\t}\n\t\n\tasync decrypt(type, ssrcId, header, encryptedFrame, skip)\n\t{\n\t\tlet authTag, payload, extrabytes = 0, signature, signed;\n\t\tconst prevAuthTags = [];\n\t\t\n\t\t//convert if needed\n\t\tif (!(encryptedFrame instanceof Uint8Array))\n\t\t\tencryptedFrame = new Uint8Array (encryptedFrame);\n\n\t\t// Replay attack protection\n\t\tif (header.counter < this.maxReceivedCounter && (this.maxReceivedCounter - header.counter) > ReplayWindow) {\n\t\t\t//Error\n\t\t\tthrow new Error(\"Replay check failed, frame counter too old\");\n\t\t}\n\t\t\n\t\t//Check if frame contains signature\n\t\tif (header.signature)\n\t\t{\n\t\t\t//Start from the end\n\t\t\tlet end = encryptedFrame.byteLength;\n\t\t\t\n\t\t\t//Get lengths\n\t\t\tconst singatureLength = ECDSAVerifyKey.getSignatureLen();\n\t\t\tconst authTagLength   = _AesCm128HmacSha256EncryptionKey_js__WEBPACK_IMPORTED_MODULE_3__[\"AesCm128HmacSha256EncryptionKey\"].getAuthTagLen(type);\n\t\t\t\n\t\t\t//Get signature\n\t\t\tsignature = encryptedFrame.subarray(end - singatureLength, end);\n\t\t\t//Move backward\n\t\t\tend -= singatureLength;\n\t\t\t\n\t\t\t//Get number of tags\n\t\t\tconst num = encryptedFrame[end--];\n\t\t\t\n\t\t\t//Read all tags\n\t\t\tfor (let i=0; i<num; ++i)\n\t\t\t{\n\t\t\t\t//Get previous tag\n\t\t\t\tconst prevTag = encryptedFrame.subarray(end - authTagLength, end);\n\t\t\t\t//Move backward\n\t\t\t\tend -= authTagLength;\n\t\t\t\t//Add tag to previous tags in hex\n\t\t\t\tprevAuthTags.push(_Utils_js__WEBPACK_IMPORTED_MODULE_0__[\"Utils\"].toHex(prevTag))\n\t\t\t}\n\t\t\t//Get the extra bytes\n\t\t\textrabytes = encryptedFrame.byteLength - end;\n\t\t\t\n\t\t\t//Move backward to start oth current frame auth tag\n\t\t\tend -= authTagLength;\n\t\t\t\n\t\t\t//Get singed part\n\t\t\tsigned = encryptedFrame.subarray(end, encryptedFrame.byteLength - singatureLength)\n\t\t}\n\n\t\t//For each key in key ring\n\t\tfor (let i=0;i<this.keyring.length;++i)\n\t\t{\n\t\t\t//Get key from ring\n\t\t\tconst key = this.keyring[i];\n\t\t\ttry {\n\t\t\t\t//Try to decrypt payload\n\t\t\t\t[payload, authTag] = await key.decrypt(type, header, encryptedFrame, extrabytes, skip);\n\t\t\t\t//Done\n\t\t\t\tbreak;\n\t\t\t} catch(e) {\n\t\t\t\t\n\t\t\t}\n\t\t}\n\n\t\t//If not found yet\n\t\tif (!payload)\n\t\t{\n\t\t\t//Get last key\n\t\t\tconst key = this.keyring[this.keyring.length-1];\n\t\t\t//Try ratchet last key\n\t\t\tfor (let i = 0; i < MaxRatchetAttempts; ++i)\n\t\t\t{\n\t\t\t\t//Ratchet key\n\t\t\t\tconst ratchetKey = await key.ratchet(i);\n\t\t\t\ttry {\n\t\t\t\t\t//Try to decrypt payload\n\t\t\t\t\t[payload, authTag] = await ratchetKey.decrypt(type, header, encryptedFrame, extrabytes, skip);\n\t\t\t\t\t// Set working ratchet as new key\n\t\t\t\t\tthis.keyring.push(ratchetKey);\n\t\t\t\t\tthis.schedulePreviousKeysTimeout(ratchetKey);\n\t\t\t\t\t//Done\n\t\t\t\t\tbreak;\n\t\t\t\t} catch(e) {\n\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t//Last check\n\t\tif (!payload) {\n\t\t\t//Decryption failed\n\t\t\tif (this.keyFailing)  {\n\t\t\t\tthrow new Error('decryptStillFailing')\n\t\t\t} else {\n\t\t\t\tthis.keyFailing = true;\n\t\t\t\tthrow new Error(\"decryptFailed\");\n\t\t\t}\n\t\t}\n\n\t\t//If we are sending part of the frame in clear\n\t\tif (skip)\n\t\t\t//Copy skiped payload\n\t\t\tpayload.set(encryptedFrame.subarray(0,skip),0);\n\n\t\t//Check if have received anything from this ssrc before\n\t\tif (!this.pending.has(ssrcId))\n\t\t\t//Add it\n\t\t\tthis.pending.set(ssrcId,new Set());\n\n\t\t//Get pending list\n\t\tconst pending = this.pending.get(ssrcId);\n\n\t\t//Check if it constains signatures\n\t\tif (header.signed)\n\t\t{\n\t\t\t//try to verify list\n\t\t\tif (!await this.verifyKey.verify(signed,signature))\n\t\t\t\t//Error\n\t\t\t\tthrow new Error(\"Could not verify signature\");\n\t\t\t//For each signed tag\n\t\t\tfor (const tag in prevAuthTags)\n\t\t\t\t//Delete from pending to be verified tags\n\t\t\t\tpending.delete(tag);\n\t\t} else {\n\t\t\t//Push this tag to\n\t\t\tpending.add(_Utils_js__WEBPACK_IMPORTED_MODULE_0__[\"Utils\"].toHex(authTag));\n\t\t}\n\n\t\t//Set authenticated sender id and frame Id\n\t\tpayload.senderId = header.keyId;\n\t\tpayload.frameId  = header.counter;\n\n\t\t// inform that decryption is working after previously failing\n\t\tif (this.keyFailing) {\n\t\t\tpayload.decryptionRestored = true;\n\t\t\tthis.keyFailing = false;\n\t\t}\n\n\t\t//Store last received counter\n\t\tthis.maxReceivedCounter = Math.max(header.counter, this.maxReceivedCounter);\n\n\t\t//Return decrypted payload\n\t\treturn payload;\n\t}\n\n\tasync setVerifyKey(key)\n\t{\n\t\t//Create new singing key\n\t\tthis.verifyKey = _EcdsaVerifyKey_js__WEBPACK_IMPORTED_MODULE_2__[\"EcdsaVerifyKey\"].create(key);\n\t}\n\n\tasync setEncryptionKey(raw)\n\t{\n\t\t//Create new encryption key\n\t\tconst key = await _AesCm128HmacSha256EncryptionKey_js__WEBPACK_IMPORTED_MODULE_3__[\"AesCm128HmacSha256EncryptionKey\"].create(raw);\n\t\t//Append to the keyring\n\t\tthis.keyring.push(key);\n\t\t//Restart ratchet count number\n\t\tthis.numKeyRatchets = 0;\n\t\t//Activate\n\t\tthis.schedulePreviousKeysTimeout(key);\n\t}\n};\n\n\n/***/ }),\n\n/***/ \"./lib/Salts.js\":\n/*!**********************!*\\\n  !*** ./lib/Salts.js ***!\n  \\**********************/\n/*! exports provided: Salts */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Salts\", function() { return Salts; });\nconst textEncoder = new TextEncoder()\n\nconst Salts =  {\n\t\"SaltKey\"\t\t: textEncoder.encode(\"SFrameSaltKey\"),\n\t\"EncryptionKey\"\t\t: textEncoder.encode(\"SFrameEncryptionKey\"),\n\t\"AuthenticationKey\"\t: textEncoder.encode(\"SFrameAuthenticationKey\"),\n\t\"RatchetKey\"\t\t: textEncoder.encode(\"SFrameRatchetKey\")\n};\n\n\n/***/ }),\n\n/***/ \"./lib/Sender.js\":\n/*!***********************!*\\\n  !*** ./lib/Sender.js ***!\n  \\***********************/\n/*! exports provided: Sender */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Sender\", function() { return Sender; });\n/* harmony import */ var _Header_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Header.js */ \"./lib/Header.js\");\n/* harmony import */ var _EcdsaSignKey_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./EcdsaSignKey.js */ \"./lib/EcdsaSignKey.js\");\n/* harmony import */ var _AesCm128HmacSha256EncryptionKey_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./AesCm128HmacSha256EncryptionKey.js */ \"./lib/AesCm128HmacSha256EncryptionKey.js\");\n\n\n\n\n\nconst SigningFrameInterval = 10;\n\nclass Sender\n{\n\tconstructor(senderId)\n\t{\n\t\t//Check keyId\n\t\t_Header_js__WEBPACK_IMPORTED_MODULE_0__[\"Header\"].checkKeyId(senderId);\n\t\t\n\t\t//The global frame counter\n\t\tthis.counter = 0;\n\t\t\n\t\t//Store senderId/keyId\n\t\tthis.senderId = senderId;\n\t\t\n\t\t//Pending frames for signing\n\t\tthis.pending = new Map();\n\t}\n\t\n\tasync encrypt(type, ssrcId, payload, skip)\n\t{\n\t\t//Check we have a valid key\n\t\tif (!this.key)\n\t\t\tthrow Error(\"Encryption key not set\");\n\t\t\n\t\t//convert if needed\n\t\tif (!(payload instanceof Uint8Array))\n\t\t\tpayload = new Uint8Array (payload);\n\t\t\n\t\t//Encure int\n\t\tskip = skip ? skip : 0;\n\t\t\n\t\t//Get counter for frame\n\t\tconst counter = this.counter++;\n\t\t\n\t\t//If we don't have the ssrc\n\t\t// TODO FIX https://github.com/medooze/sframe/issues/15 and uncomment line below\n\t\t// if (!this.pending.has(ssrcId))\n\t\t//Create new pending frames array\n\t\t\tthis.pending.set(ssrcId,[]);\n\t\t\n\t\t//Get pending frames for signature\n\t\tconst pending = this.pending.get(ssrcId);\t\t\n\t\t\n\t\t//Do we need to sign the frames?\n\t\tconst signing = this.signingKey && pending.length > SigningFrameInterval;\n\t\t\n\t\t//Get auth tag len for type\n\t\tconst authTagLen = _AesCm128HmacSha256EncryptionKey_js__WEBPACK_IMPORTED_MODULE_2__[\"AesCm128HmacSha256EncryptionKey\"].getAuthTagLen(type);\n\t\t\n\t\t//Calculae extra bytes\n\t\tconst extraBytes = signing ? pending.length * _AesCm128HmacSha256EncryptionKey_js__WEBPACK_IMPORTED_MODULE_2__[\"AesCm128HmacSha256EncryptionKey\"].getAuthTagLen(type) + 1 + _EcdsaSignKey_js__WEBPACK_IMPORTED_MODULE_1__[\"EcdsaSignKey\"].getSignatureLen() : 0;\n\t\t\n\t\t//Generate header\n\t\tconst header = _Header_js__WEBPACK_IMPORTED_MODULE_0__[\"Header\"].generate(signing,this.senderId,counter);\n\t\t\n\t\t//Encrypt frame\n\t\tconst [encryptedFrame,authTag] = await this.key.encrypt(type, header, payload, extraBytes, skip);\n\t\t\n\t\t//If we are sending part of the frame in clear\n\t\tif (skip)\n\t\t\t//Copy skiped payload\n\t\t\tencryptedFrame.set(payload.subarray(0,skip),0);\n\t\t\n\t\t//If we need to sign the frame\n\t\tif (signing)\n\t\t{\n\t\t\t//Append after auth tag\n\t\t\tlet ini = skip + encryptedFrame.byteLength - extraBytes;\n\t\t\t\n\t\t\t//Get tag list view\n\t\t\tconst authTags = encryptedFrame.subarray(ini - authTagLen, (pending.length + 1) * authTagLen);\n\t\t\t\n\t\t\t//Add all previous tags \n\t\t\tfor (const previousTag of pending)\n\t\t\t{\n\t\t\t\t//Append to frame\n\t\t\t\tencryptedFrame.set(previousTag, ini);\n\t\t\t\t//Move\n\t\t\t\tini += authTagLen;\n\t\t\t}\n\t\t\t\n\t\t\t//Add number of bytes\n\t\t\tencryptedFrame[ini++] = pending.length;\n\t\t\t\n\t\t\t//Create signature with all auth tags (including this frame's one)\n\t\t\tconst signature = await this.signingKey.sign(authTags);\n\t\t\t\n\t\t\t//Add signature\n\t\t\tencryptedFrame.set(signature, ini);\n\t\t\t\n\t\t\t//Empty pending list \n\t\t\tthis.pending.set(ssrcId,[]);\n\t\t\t\n\t\t//If we can sign\n\t\t} else if (this.signingKey) {\n\t\t\t//Append a copy of current tag at the begining\n\t\t\tpending.unshift(authTag.slice());\n\t\t}\n\t\t\n\t\t//Set authenticated sender id and frame Id\n\t\tencryptedFrame.senderId = header.keyId;\n\t\tencryptedFrame.frameId  = header.counter;\n\t\t\n\t\t//Done\n\t\treturn encryptedFrame;\n\t}\n\t\n\tasync setSigningKey(key)\n\t{\n\t\t//Create new singing key\n\t\tthis.signingKey = await _EcdsaSignKey_js__WEBPACK_IMPORTED_MODULE_1__[\"EcdsaSignKey\"].create(key);\n\t}\n\t\n\tasync setEncryptionKey(key)\n\t{\n\t\t//Create new encryption key\n\t\tthis.key = await _AesCm128HmacSha256EncryptionKey_js__WEBPACK_IMPORTED_MODULE_2__[\"AesCm128HmacSha256EncryptionKey\"].create(key);\n\t}\n\t\n\tasync ratchetEncryptionKey()\n\t{\n\t\t//Check we have a valid key\n\t\tif (!this.key)\n\t\t\tthrow Error(\"Encryption key not set\");\n\t\t\n\t\t//Rachet the key and store it\n\t\tthis.key = await this.key.ratchet();\n\t}\n};\n\n\n/***/ }),\n\n/***/ \"./lib/TaskQueue.js\":\n/*!**************************!*\\\n  !*** ./lib/TaskQueue.js ***!\n  \\**************************/\n/*! exports provided: TaskQueue */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"TaskQueue\", function() { return TaskQueue; });\nclass TaskQueue\n{\n\tconstructor()\n\t{\n\t\tthis.tasks = [];\n\t\tthis.running = false;\n\t}\n\t\n\tenqueue(promise,callback,error)\n\t{\n\t\t//enqueue task\n\t\tthis.tasks.push({promise,callback,error});\n\t\t//Try run \n\t\tthis.run();\n\t}\n\t\n\tasync run()\n\t{\n\t\t//If already running \n\t\tif (this.running)\n\t\t\t//Nothing\n\t\t\treturn;\n\t\t//Running\n\t\tthis.running = true;\n\t\t//Run all pending tasks\n\t\twhile(this.tasks.length)\n\t\t{\n\t\t\ttry {\n\t\t\t\t//Wait for first promise to finish\n\t\t\t\tconst result = await this.tasks[0].promise;\n\t\t\t\t//Run callback\n\t\t\t\tthis.tasks[0].callback(result); \n\t\t\t} catch(e) {\n\t\t\t\t//Run error callback\n\t\t\t\tthis.tasks[0].error(e); \n\t\t\t}\n\t\t\t//Remove task from queue\n\t\t\tthis.tasks.shift();\n\t\t}\n\t\t//Ended\n\t\tthis.running = false;\n\t}\n}\n\n\n/***/ }),\n\n/***/ \"./lib/Utils.js\":\n/*!**********************!*\\\n  !*** ./lib/Utils.js ***!\n  \\**********************/\n/*! exports provided: Utils */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Utils\", function() { return Utils; });\nconst Utils = \n{\n\ttoHex : function(buffer)\n\t{\n\t\treturn Array.prototype.map.call(buffer instanceof Uint8Array ? buffer : new Uint8Array (buffer), x =>x.toString(16).padStart(2,\"0\")).join(\"\");\n\t},\n\tfromHex: function(str)\n\t{\n\t\tconst bytes = [];\n\t\tfor (let i=0;i<str.length/2;++i)\n\t\t\tbytes.push(parseInt(str.substring(i*2, (i+1)*2), 16));\n\n\t\treturn new Uint8Array(bytes);\n\t},\n\tequals : function(a,b)\n\t{\n\t\tif (a.byteLength != b.byteLength) return false;\n\t\tfor (let i = 0 ; i != a.byteLength ; i++)\n\t\t\tif (a[i] != b[i]) return false;\n\t\treturn true;\n\t}\n};\n\n\n/***/ }),\n\n/***/ \"./lib/VP8PayloadHeader.js\":\n/*!*********************************!*\\\n  !*** ./lib/VP8PayloadHeader.js ***!\n  \\*********************************/\n/*! exports provided: VP8PayloadHeader */\n/***/ (function(module, __webpack_exports__, __webpack_require__) {\n\n\"use strict\";\n__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"VP8PayloadHeader\", function() { return VP8PayloadHeader; });\n\nconst VP8PayloadHeader = {\n\t\n\tparse : function(buffer) \n\t{\n\t\t//Check size\n\t\tif (buffer.byteLength<3)\n\t\t\t//Invalid\n\t\t\treturn null;\n\t\t\n\t\t//Create uint view\n\t\tconst view = new Uint8Array(buffer);\n\t\t\n\t\t//Read comon 3 bytes\n\t\t//   0 1 2 3 4 5 6 7\n                //  +-+-+-+-+-+-+-+-+\n                //  |Size0|H| VER |P|\n                //  +-+-+-+-+-+-+-+-+\n                //  |     Size1     |\n                //  +-+-+-+-+-+-+-+-+\n                //  |     Size2     |\n                //  +-+-+-+-+-+-+-+-+\n\t\tconst firstPartitionSize\t= view[0] >> 5;\n\t\tconst showFrame\t\t\t= view[0] >> 4 & 0x01;\n\t\tconst version\t\t\t= view[0] >> 1 & 0x07;\n\t\tconst isKeyFrame\t\t= (view[0] & 0x01) == 0;\n\n\t\t//check if more\n\t\tif (isKeyFrame)\n\t\t{\n\t\t\t//Check size\n\t\t\tif (buffer.byteLength<10)\n\t\t\t\t//Invalid\n\t\t\t\treturn null;\n\t\t\t//Get size in le\n\t\t\tconst hor = view[7]<<8 | view[6];\n\t\t\tconst ver = view[9]<<8 | view[8];\n\t\t\t//Get dimensions and scale\n\t\t\tconst width\t\t= hor & 0x3fff;\n\t\t\tconst horizontalScale   = hor >> 14;\n\t\t\tconst height\t\t= ver & 0x3fff;\n\t\t\tconst verticalScale\t= ver >> 14;\n\t\t\t//Key frame\n\t\t\treturn view.subarray (0,10);\n\t\t}\n\t\t\n\t\t//No key frame\n\t\treturn view.subarray (0,3);\n\t}\n};\n\n\t\t\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/_Symbol.js\":\n/*!****************************************!*\\\n  !*** ./node_modules/lodash/_Symbol.js ***!\n  \\****************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar root = __webpack_require__(/*! ./_root */ \"./node_modules/lodash/_root.js\");\n\n/** Built-in value references. */\nvar Symbol = root.Symbol;\n\nmodule.exports = Symbol;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/_baseGetTag.js\":\n/*!********************************************!*\\\n  !*** ./node_modules/lodash/_baseGetTag.js ***!\n  \\********************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar Symbol = __webpack_require__(/*! ./_Symbol */ \"./node_modules/lodash/_Symbol.js\"),\n    getRawTag = __webpack_require__(/*! ./_getRawTag */ \"./node_modules/lodash/_getRawTag.js\"),\n    objectToString = __webpack_require__(/*! ./_objectToString */ \"./node_modules/lodash/_objectToString.js\");\n\n/** `Object#toString` result references. */\nvar nullTag = '[object Null]',\n    undefinedTag = '[object Undefined]';\n\n/** Built-in value references. */\nvar symToStringTag = Symbol ? Symbol.toStringTag : undefined;\n\n/**\n * The base implementation of `getTag` without fallbacks for buggy environments.\n *\n * @private\n * @param {*} value The value to query.\n * @returns {string} Returns the `toStringTag`.\n */\nfunction baseGetTag(value) {\n  if (value == null) {\n    return value === undefined ? undefinedTag : nullTag;\n  }\n  return (symToStringTag && symToStringTag in Object(value))\n    ? getRawTag(value)\n    : objectToString(value);\n}\n\nmodule.exports = baseGetTag;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/_baseTrim.js\":\n/*!******************************************!*\\\n  !*** ./node_modules/lodash/_baseTrim.js ***!\n  \\******************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar trimmedEndIndex = __webpack_require__(/*! ./_trimmedEndIndex */ \"./node_modules/lodash/_trimmedEndIndex.js\");\n\n/** Used to match leading whitespace. */\nvar reTrimStart = /^\\s+/;\n\n/**\n * The base implementation of `_.trim`.\n *\n * @private\n * @param {string} string The string to trim.\n * @returns {string} Returns the trimmed string.\n */\nfunction baseTrim(string) {\n  return string\n    ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, '')\n    : string;\n}\n\nmodule.exports = baseTrim;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/_freeGlobal.js\":\n/*!********************************************!*\\\n  !*** ./node_modules/lodash/_freeGlobal.js ***!\n  \\********************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\n/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */\nvar freeGlobal = typeof global == 'object' && global && global.Object === Object && global;\n\nmodule.exports = freeGlobal;\n\n/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ \"./node_modules/webpack/buildin/global.js\")))\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/_getRawTag.js\":\n/*!*******************************************!*\\\n  !*** ./node_modules/lodash/_getRawTag.js ***!\n  \\*******************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar Symbol = __webpack_require__(/*! ./_Symbol */ \"./node_modules/lodash/_Symbol.js\");\n\n/** Used for built-in method references. */\nvar objectProto = Object.prototype;\n\n/** Used to check objects for own properties. */\nvar hasOwnProperty = objectProto.hasOwnProperty;\n\n/**\n * Used to resolve the\n * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)\n * of values.\n */\nvar nativeObjectToString = objectProto.toString;\n\n/** Built-in value references. */\nvar symToStringTag = Symbol ? Symbol.toStringTag : undefined;\n\n/**\n * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.\n *\n * @private\n * @param {*} value The value to query.\n * @returns {string} Returns the raw `toStringTag`.\n */\nfunction getRawTag(value) {\n  var isOwn = hasOwnProperty.call(value, symToStringTag),\n      tag = value[symToStringTag];\n\n  try {\n    value[symToStringTag] = undefined;\n    var unmasked = true;\n  } catch (e) {}\n\n  var result = nativeObjectToString.call(value);\n  if (unmasked) {\n    if (isOwn) {\n      value[symToStringTag] = tag;\n    } else {\n      delete value[symToStringTag];\n    }\n  }\n  return result;\n}\n\nmodule.exports = getRawTag;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/_objectToString.js\":\n/*!************************************************!*\\\n  !*** ./node_modules/lodash/_objectToString.js ***!\n  \\************************************************/\n/*! no static exports found */\n/***/ (function(module, exports) {\n\n/** Used for built-in method references. */\nvar objectProto = Object.prototype;\n\n/**\n * Used to resolve the\n * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)\n * of values.\n */\nvar nativeObjectToString = objectProto.toString;\n\n/**\n * Converts `value` to a string using `Object.prototype.toString`.\n *\n * @private\n * @param {*} value The value to convert.\n * @returns {string} Returns the converted string.\n */\nfunction objectToString(value) {\n  return nativeObjectToString.call(value);\n}\n\nmodule.exports = objectToString;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/_root.js\":\n/*!**************************************!*\\\n  !*** ./node_modules/lodash/_root.js ***!\n  \\**************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar freeGlobal = __webpack_require__(/*! ./_freeGlobal */ \"./node_modules/lodash/_freeGlobal.js\");\n\n/** Detect free variable `self`. */\nvar freeSelf = typeof self == 'object' && self && self.Object === Object && self;\n\n/** Used as a reference to the global object. */\nvar root = freeGlobal || freeSelf || Function('return this')();\n\nmodule.exports = root;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/_trimmedEndIndex.js\":\n/*!*************************************************!*\\\n  !*** ./node_modules/lodash/_trimmedEndIndex.js ***!\n  \\*************************************************/\n/*! no static exports found */\n/***/ (function(module, exports) {\n\n/** Used to match a single whitespace character. */\nvar reWhitespace = /\\s/;\n\n/**\n * Used by `_.trim` and `_.trimEnd` to get the index of the last non-whitespace\n * character of `string`.\n *\n * @private\n * @param {string} string The string to inspect.\n * @returns {number} Returns the index of the last non-whitespace character.\n */\nfunction trimmedEndIndex(string) {\n  var index = string.length;\n\n  while (index-- && reWhitespace.test(string.charAt(index))) {}\n  return index;\n}\n\nmodule.exports = trimmedEndIndex;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/debounce.js\":\n/*!*****************************************!*\\\n  !*** ./node_modules/lodash/debounce.js ***!\n  \\*****************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar isObject = __webpack_require__(/*! ./isObject */ \"./node_modules/lodash/isObject.js\"),\n    now = __webpack_require__(/*! ./now */ \"./node_modules/lodash/now.js\"),\n    toNumber = __webpack_require__(/*! ./toNumber */ \"./node_modules/lodash/toNumber.js\");\n\n/** Error message constants. */\nvar FUNC_ERROR_TEXT = 'Expected a function';\n\n/* Built-in method references for those with the same name as other `lodash` methods. */\nvar nativeMax = Math.max,\n    nativeMin = Math.min;\n\n/**\n * Creates a debounced function that delays invoking `func` until after `wait`\n * milliseconds have elapsed since the last time the debounced function was\n * invoked. The debounced function comes with a `cancel` method to cancel\n * delayed `func` invocations and a `flush` method to immediately invoke them.\n * Provide `options` to indicate whether `func` should be invoked on the\n * leading and/or trailing edge of the `wait` timeout. The `func` is invoked\n * with the last arguments provided to the debounced function. Subsequent\n * calls to the debounced function return the result of the last `func`\n * invocation.\n *\n * **Note:** If `leading` and `trailing` options are `true`, `func` is\n * invoked on the trailing edge of the timeout only if the debounced function\n * is invoked more than once during the `wait` timeout.\n *\n * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred\n * until to the next tick, similar to `setTimeout` with a timeout of `0`.\n *\n * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)\n * for details over the differences between `_.debounce` and `_.throttle`.\n *\n * @static\n * @memberOf _\n * @since 0.1.0\n * @category Function\n * @param {Function} func The function to debounce.\n * @param {number} [wait=0] The number of milliseconds to delay.\n * @param {Object} [options={}] The options object.\n * @param {boolean} [options.leading=false]\n *  Specify invoking on the leading edge of the timeout.\n * @param {number} [options.maxWait]\n *  The maximum time `func` is allowed to be delayed before it's invoked.\n * @param {boolean} [options.trailing=true]\n *  Specify invoking on the trailing edge of the timeout.\n * @returns {Function} Returns the new debounced function.\n * @example\n *\n * // Avoid costly calculations while the window size is in flux.\n * jQuery(window).on('resize', _.debounce(calculateLayout, 150));\n *\n * // Invoke `sendMail` when clicked, debouncing subsequent calls.\n * jQuery(element).on('click', _.debounce(sendMail, 300, {\n *   'leading': true,\n *   'trailing': false\n * }));\n *\n * // Ensure `batchLog` is invoked once after 1 second of debounced calls.\n * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });\n * var source = new EventSource('/stream');\n * jQuery(source).on('message', debounced);\n *\n * // Cancel the trailing debounced invocation.\n * jQuery(window).on('popstate', debounced.cancel);\n */\nfunction debounce(func, wait, options) {\n  var lastArgs,\n      lastThis,\n      maxWait,\n      result,\n      timerId,\n      lastCallTime,\n      lastInvokeTime = 0,\n      leading = false,\n      maxing = false,\n      trailing = true;\n\n  if (typeof func != 'function') {\n    throw new TypeError(FUNC_ERROR_TEXT);\n  }\n  wait = toNumber(wait) || 0;\n  if (isObject(options)) {\n    leading = !!options.leading;\n    maxing = 'maxWait' in options;\n    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;\n    trailing = 'trailing' in options ? !!options.trailing : trailing;\n  }\n\n  function invokeFunc(time) {\n    var args = lastArgs,\n        thisArg = lastThis;\n\n    lastArgs = lastThis = undefined;\n    lastInvokeTime = time;\n    result = func.apply(thisArg, args);\n    return result;\n  }\n\n  function leadingEdge(time) {\n    // Reset any `maxWait` timer.\n    lastInvokeTime = time;\n    // Start the timer for the trailing edge.\n    timerId = setTimeout(timerExpired, wait);\n    // Invoke the leading edge.\n    return leading ? invokeFunc(time) : result;\n  }\n\n  function remainingWait(time) {\n    var timeSinceLastCall = time - lastCallTime,\n        timeSinceLastInvoke = time - lastInvokeTime,\n        timeWaiting = wait - timeSinceLastCall;\n\n    return maxing\n      ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)\n      : timeWaiting;\n  }\n\n  function shouldInvoke(time) {\n    var timeSinceLastCall = time - lastCallTime,\n        timeSinceLastInvoke = time - lastInvokeTime;\n\n    // Either this is the first call, activity has stopped and we're at the\n    // trailing edge, the system time has gone backwards and we're treating\n    // it as the trailing edge, or we've hit the `maxWait` limit.\n    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||\n      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));\n  }\n\n  function timerExpired() {\n    var time = now();\n    if (shouldInvoke(time)) {\n      return trailingEdge(time);\n    }\n    // Restart the timer.\n    timerId = setTimeout(timerExpired, remainingWait(time));\n  }\n\n  function trailingEdge(time) {\n    timerId = undefined;\n\n    // Only invoke if we have `lastArgs` which means `func` has been\n    // debounced at least once.\n    if (trailing && lastArgs) {\n      return invokeFunc(time);\n    }\n    lastArgs = lastThis = undefined;\n    return result;\n  }\n\n  function cancel() {\n    if (timerId !== undefined) {\n      clearTimeout(timerId);\n    }\n    lastInvokeTime = 0;\n    lastArgs = lastCallTime = lastThis = timerId = undefined;\n  }\n\n  function flush() {\n    return timerId === undefined ? result : trailingEdge(now());\n  }\n\n  function debounced() {\n    var time = now(),\n        isInvoking = shouldInvoke(time);\n\n    lastArgs = arguments;\n    lastThis = this;\n    lastCallTime = time;\n\n    if (isInvoking) {\n      if (timerId === undefined) {\n        return leadingEdge(lastCallTime);\n      }\n      if (maxing) {\n        // Handle invocations in a tight loop.\n        clearTimeout(timerId);\n        timerId = setTimeout(timerExpired, wait);\n        return invokeFunc(lastCallTime);\n      }\n    }\n    if (timerId === undefined) {\n      timerId = setTimeout(timerExpired, wait);\n    }\n    return result;\n  }\n  debounced.cancel = cancel;\n  debounced.flush = flush;\n  return debounced;\n}\n\nmodule.exports = debounce;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/isObject.js\":\n/*!*****************************************!*\\\n  !*** ./node_modules/lodash/isObject.js ***!\n  \\*****************************************/\n/*! no static exports found */\n/***/ (function(module, exports) {\n\n/**\n * Checks if `value` is the\n * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)\n * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)\n *\n * @static\n * @memberOf _\n * @since 0.1.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is an object, else `false`.\n * @example\n *\n * _.isObject({});\n * // => true\n *\n * _.isObject([1, 2, 3]);\n * // => true\n *\n * _.isObject(_.noop);\n * // => true\n *\n * _.isObject(null);\n * // => false\n */\nfunction isObject(value) {\n  var type = typeof value;\n  return value != null && (type == 'object' || type == 'function');\n}\n\nmodule.exports = isObject;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/isObjectLike.js\":\n/*!*********************************************!*\\\n  !*** ./node_modules/lodash/isObjectLike.js ***!\n  \\*********************************************/\n/*! no static exports found */\n/***/ (function(module, exports) {\n\n/**\n * Checks if `value` is object-like. A value is object-like if it's not `null`\n * and has a `typeof` result of \"object\".\n *\n * @static\n * @memberOf _\n * @since 4.0.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is object-like, else `false`.\n * @example\n *\n * _.isObjectLike({});\n * // => true\n *\n * _.isObjectLike([1, 2, 3]);\n * // => true\n *\n * _.isObjectLike(_.noop);\n * // => false\n *\n * _.isObjectLike(null);\n * // => false\n */\nfunction isObjectLike(value) {\n  return value != null && typeof value == 'object';\n}\n\nmodule.exports = isObjectLike;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/isSymbol.js\":\n/*!*****************************************!*\\\n  !*** ./node_modules/lodash/isSymbol.js ***!\n  \\*****************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar baseGetTag = __webpack_require__(/*! ./_baseGetTag */ \"./node_modules/lodash/_baseGetTag.js\"),\n    isObjectLike = __webpack_require__(/*! ./isObjectLike */ \"./node_modules/lodash/isObjectLike.js\");\n\n/** `Object#toString` result references. */\nvar symbolTag = '[object Symbol]';\n\n/**\n * Checks if `value` is classified as a `Symbol` primitive or object.\n *\n * @static\n * @memberOf _\n * @since 4.0.0\n * @category Lang\n * @param {*} value The value to check.\n * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.\n * @example\n *\n * _.isSymbol(Symbol.iterator);\n * // => true\n *\n * _.isSymbol('abc');\n * // => false\n */\nfunction isSymbol(value) {\n  return typeof value == 'symbol' ||\n    (isObjectLike(value) && baseGetTag(value) == symbolTag);\n}\n\nmodule.exports = isSymbol;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/now.js\":\n/*!************************************!*\\\n  !*** ./node_modules/lodash/now.js ***!\n  \\************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar root = __webpack_require__(/*! ./_root */ \"./node_modules/lodash/_root.js\");\n\n/**\n * Gets the timestamp of the number of milliseconds that have elapsed since\n * the Unix epoch (1 January 1970 00:00:00 UTC).\n *\n * @static\n * @memberOf _\n * @since 2.4.0\n * @category Date\n * @returns {number} Returns the timestamp.\n * @example\n *\n * _.defer(function(stamp) {\n *   console.log(_.now() - stamp);\n * }, _.now());\n * // => Logs the number of milliseconds it took for the deferred invocation.\n */\nvar now = function() {\n  return root.Date.now();\n};\n\nmodule.exports = now;\n\n\n/***/ }),\n\n/***/ \"./node_modules/lodash/toNumber.js\":\n/*!*****************************************!*\\\n  !*** ./node_modules/lodash/toNumber.js ***!\n  \\*****************************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\nvar baseTrim = __webpack_require__(/*! ./_baseTrim */ \"./node_modules/lodash/_baseTrim.js\"),\n    isObject = __webpack_require__(/*! ./isObject */ \"./node_modules/lodash/isObject.js\"),\n    isSymbol = __webpack_require__(/*! ./isSymbol */ \"./node_modules/lodash/isSymbol.js\");\n\n/** Used as references for various `Number` constants. */\nvar NAN = 0 / 0;\n\n/** Used to detect bad signed hexadecimal string values. */\nvar reIsBadHex = /^[-+]0x[0-9a-f]+$/i;\n\n/** Used to detect binary string values. */\nvar reIsBinary = /^0b[01]+$/i;\n\n/** Used to detect octal string values. */\nvar reIsOctal = /^0o[0-7]+$/i;\n\n/** Built-in method references without a dependency on `root`. */\nvar freeParseInt = parseInt;\n\n/**\n * Converts `value` to a number.\n *\n * @static\n * @memberOf _\n * @since 4.0.0\n * @category Lang\n * @param {*} value The value to process.\n * @returns {number} Returns the number.\n * @example\n *\n * _.toNumber(3.2);\n * // => 3.2\n *\n * _.toNumber(Number.MIN_VALUE);\n * // => 5e-324\n *\n * _.toNumber(Infinity);\n * // => Infinity\n *\n * _.toNumber('3.2');\n * // => 3.2\n */\nfunction toNumber(value) {\n  if (typeof value == 'number') {\n    return value;\n  }\n  if (isSymbol(value)) {\n    return NAN;\n  }\n  if (isObject(value)) {\n    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;\n    value = isObject(other) ? (other + '') : other;\n  }\n  if (typeof value != 'string') {\n    return value === 0 ? value : +value;\n  }\n  value = baseTrim(value);\n  var isBinary = reIsBinary.test(value);\n  return (isBinary || reIsOctal.test(value))\n    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)\n    : (reIsBadHex.test(value) ? NAN : +value);\n}\n\nmodule.exports = toNumber;\n\n\n/***/ }),\n\n/***/ \"./node_modules/webpack/buildin/global.js\":\n/*!***********************************!*\\\n  !*** (webpack)/buildin/global.js ***!\n  \\***********************************/\n/*! no static exports found */\n/***/ (function(module, exports) {\n\nvar g;\n\n// This works in non-strict mode\ng = (function() {\n\treturn this;\n})();\n\ntry {\n\t// This works if eval is allowed (see CSP)\n\tg = g || new Function(\"return this\")();\n} catch (e) {\n\t// This works if the window reference is available\n\tif (typeof window === \"object\") g = window;\n}\n\n// g can still be undefined, but nothing to do about it...\n// We return undefined, instead of nothing here, so it's\n// easier to handle this case. if(!global) { ...}\n\nmodule.exports = g;\n\n\n/***/ })\n\n/******/ });\n", "Worker", undefined, undefined);
}


/***/ }),

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! exports provided: SFrame, Utils */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _sframe_lib_Utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../sframe/lib/Utils */ "./lib/Utils.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Utils", function() { return _sframe_lib_Utils__WEBPACK_IMPORTED_MODULE_0__["Utils"]; });

/* harmony import */ var _Client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Client */ "./Client.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "SFrame", function() { return _Client__WEBPACK_IMPORTED_MODULE_1__["SFrame"]; });







/***/ }),

/***/ "./lib/Utils.js":
/*!**********************!*\
  !*** ./lib/Utils.js ***!
  \**********************/
/*! exports provided: Utils */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Utils", function() { return Utils; });
const Utils = 
{
	toHex : function(buffer)
	{
		return Array.prototype.map.call(buffer instanceof Uint8Array ? buffer : new Uint8Array (buffer), x =>x.toString(16).padStart(2,"0")).join("");
	},
	fromHex: function(str)
	{
		const bytes = [];
		for (let i=0;i<str.length/2;++i)
			bytes.push(parseInt(str.substring(i*2, (i+1)*2), 16));

		return new Uint8Array(bytes);
	},
	equals : function(a,b)
	{
		if (a.byteLength != b.byteLength) return false;
		for (let i = 0 ; i != a.byteLength ; i++)
			if (a[i] != b[i]) return false;
		return true;
	}
};


/***/ }),

/***/ "./node_modules/worker-loader/dist/runtime/inline.js":
/*!***********************************************************!*\
  !*** ./node_modules/worker-loader/dist/runtime/inline.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* eslint-env browser */

/* eslint-disable no-undef, no-use-before-define, new-cap */
module.exports = function (content, workerConstructor, workerOptions, url) {
  var globalScope = self || window;

  try {
    try {
      var blob;

      try {
        // New API
        blob = new globalScope.Blob([content]);
      } catch (e) {
        // BlobBuilder = Deprecated, but widely implemented
        var BlobBuilder = globalScope.BlobBuilder || globalScope.WebKitBlobBuilder || globalScope.MozBlobBuilder || globalScope.MSBlobBuilder;
        blob = new BlobBuilder();
        blob.append(content);
        blob = blob.getBlob();
      }

      var URL = globalScope.URL || globalScope.webkitURL;
      var objectURL = URL.createObjectURL(blob);
      var worker = new globalScope[workerConstructor](objectURL, workerOptions);
      URL.revokeObjectURL(objectURL);
      return worker;
    } catch (e) {
      return new globalScope[workerConstructor]("data:application/javascript,".concat(encodeURIComponent(content)), workerOptions);
    }
  } catch (e) {
    if (!url) {
      throw Error("Inline worker is not supported");
    }

    return new globalScope[workerConstructor](url, workerOptions);
  }
};

/***/ })

/******/ });
});
//# sourceMappingURL=main.js.map