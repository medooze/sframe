import {SFrame}	from "../index.js";

const senderPasswordInput = document.getElementById('senderPassword');
const receiverPasswordInput = document.getElementById('receiverPassword');
const senderPasswordForm = document.getElementById('senderPasswordForm');
const receiverPasswordForm = document.getElementById('receiverPasswordForm');

async function connect()
{
	
	/*
	 Get some key material to use as input to the deriveKey method.
	 The key material is a secret key supplied by the user.
	 */
	async function getRoomKey (roomId, secret)
	{
		const enc = new TextEncoder ();
		const keyMaterial = await window.crypto.subtle.importKey (
			"raw",
			enc.encode (secret),
			{name: "PBKDF2"},
			false,
			["deriveBits", "deriveKey"]
			);
		return window.crypto.subtle.deriveKey (
			{
				name: "PBKDF2",
				salt: enc.encode (roomId),
				iterations: 100000,
				hash: "SHA-256"
			},
			keyMaterial,
			{"name": "AES-CTR", "length": 256},
			true,
			["encrypt", "decrypt"]
			);
	}

	//Get keys
	const shared  = await getRoomKey("roomId", "password");
	[senderPasswordInput, receiverPasswordInput].forEach((input) => {
		input.value = 'password';
		input.parentElement.classList.add('is-dirty');
});

	const keyPair = await window.crypto.subtle.generateKey (
		{
			name: "ECDSA",
			namedCurve: "P-521"
		},
		true,
		["sign", "verify"]
	);
	//Get cam+mic
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: true,
		video: true
	});

	//Create pcs
	const sender	= window.sender   = new RTCPeerConnection({
		forceEncodedVideoInsertableStreams: true,
		forceEncodedAudioInsertableStreams: true,
		encodedInsertableStreams: true
	});
	const receiver	= window.receiver = new RTCPeerConnection({
		forceEncodedVideoInsertableStreams: true,
		forceEncodedAudioInsertableStreams: true,
		encodedInsertableStreams: true
	});

	const senderId = 0;
	const receiverId = 1;

	//Create contexts
	const senderClient   = await SFrame.createClient(senderId, {
		skipVp8PayloadHeader: true,

	});
	const receiverClient = await SFrame.createClient(receiverId, {
		skipVp8PayloadHeader: true,
		displayFailedDecryptionFrames: true,
	});

	await senderClient.setSenderEncryptionKey(shared);
	await senderClient.setSenderSigningKey(keyPair.privateKey);

	await receiverClient.addReceiver(senderId);
	await receiverClient.setReceiverEncryptionKey(senderId,shared);

	senderPasswordForm.addEventListener('submit', async (e) =>  {
		e.preventDefault();
		const newKey = await getRoomKey("roomId", senderPasswordInput.value);
		senderClient.setSenderEncryptionKey(newKey);
	})
	receiverPasswordForm.addEventListener('submit', async (e) =>  {
		e.preventDefault();
		const newKey = await getRoomKey("roomId", receiverPasswordInput.value);
		receiverClient.setReceiverEncryptionKey(senderId, newKey);
	})

	await receiverClient.setReceiverVerifyKey(senderId,keyPair.publicKey);

	receiverClient.addEventListener("authenticated",event=>console.log("Authenticated receiver " + event.id + " for sender " + event.senderId));
	receiverClient.addEventListener("decryptFailed", () => {
		console.log('decrypt failed');
	});
	receiverClient.addEventListener("decryptionRestored", () => {
		console.log('decrypt restored');
	});

	//Set it on the local video
	local.srcObject = stream;
	local.play();

	receiver.ontrack = (event) => {
		const track	= event.track;
		const stream	= event.streams[0];

		if (!remote.srcObject)
		{
			//Set src stream
			remote.srcObject = stream;
			remote.play();
		}

		//decyprt
		receiverClient.decrypt(event.transceiver.mid, event.receiver);
	};

	//Interchange candidates
	sender.onicecandidate	= ({candidate}) => candidate && receiver.addIceCandidate(candidate);
	receiver.onicecandidate = ({candidate}) => candidate && sender.addIceCandidate(candidate);

	//Add all tracks
	for (const track of stream.getTracks())
		//Add track
		sender.addTrack(track,stream);

	const offer = await sender.createOffer();
	await sender.setLocalDescription(offer);
	await receiver.setRemoteDescription(offer);

	//For each sender
	for (const transceiver of sender.getTransceivers ())
		//Encrypt it
		senderClient.encrypt(transceiver.mid, transceiver.sender);

	const answer = await receiver.createAnswer();
	await receiver.setLocalDescription(answer);
	await sender.setRemoteDescription(answer);

};

document.body.onload = ()=>{

	const dialog = document.querySelector('dialog');
	dialog.showModal();
	dialog.querySelector('button').addEventListener('click', function(event) {
		dialog.close();
		connect();
		event.preventDefault();
	});
};
