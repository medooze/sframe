const textEncoder = new TextEncoder()

export const Salts =  {
	"SaltKey"		: textEncoder.encode("SFrameSaltKey"),
	"EncryptionKey"		: textEncoder.encode("SFrameEncryptionKey"),
	"AuthenticationKey"	: textEncoder.encode("SFrameAuthenticationKey"),
	"RatchetKey"		: textEncoder.encode("SFrameRatchetKey")
};
