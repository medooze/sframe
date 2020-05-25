export const Utils = 
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
