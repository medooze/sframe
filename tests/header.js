import {Header} from "../lib/Header.js";
import {Utils}  from "../lib/Utils.js";

//Serialize heaer for comparation
const serialize = header => Utils.toHex(header)+",s:" + (header.signature?"1":"0") + ",k:"+header.keyId.toString(16) + ",c:"+header.counter.toString(16);
		
tape.test("Header",function(suite){
	
	
	suite.test("parse",function(test){
		
		const parse = (from,to) => test.same(serialize(Header.parse(Utils.fromHex(from))),to);
		
		parse("1000caca","1000,s:0,k:0,c:0");
		parse("1001caca","1001,s:0,k:0,c:1");
		parse("9001caca","9001,s:1,k:0,c:1");
		parse("1101caca","1101,s:0,k:1,c:1");
		
		parse("40ff000000caca","40ff000000,s:0,k:0,c:ff000000");
		parse("40ff010203caca","40ff010203,s:0,k:0,c:ff010203");
		parse("c0ff0000ffcaca","c0ff0000ff,s:1,k:0,c:ff0000ff");
		parse("41ff000000caca","41ff000000,s:0,k:1,c:ff000000");
		parse("41ff010203caca","41ff010203,s:0,k:1,c:ff010203");
		parse("c1ff0000ffcaca","c1ff0000ff,s:1,k:1,c:ff0000ff");
		
		parse("190800caca","190800,s:0,k:8,c:0");
		parse("190801caca","190801,s:0,k:8,c:1");
		parse("990801caca","990801,s:1,k:8,c:1");
		
		parse("1a010000caca","1a010000,s:0,k:100,c:0");
		parse("1a010101caca","1a010101,s:0,k:101,c:1");
		parse("9a010001caca","9a010001,s:1,k:100,c:1");
		
		parse("1baabbccffcaca","1baabbccff,s:0,k:aabbcc,c:ff");
		parse("9baabbccffcaca","9baabbccff,s:1,k:aabbcc,c:ff");
		
		test.end();
	});
	
	suite.test("generate",function(test){
		//1 byte ctr !x
		test.same(Utils.toHex(Header.generate(false,0,0)), "1000");
		test.same(Utils.toHex(Header.generate(false,0,1)), "1001");
		test.same(Utils.toHex(Header.generate(true ,0,1)), "9001");

		test.same(Utils.toHex(Header.generate(false,1,0)), "1100");
		test.same(Utils.toHex(Header.generate(false,1,1)), "1101");
		test.same(Utils.toHex(Header.generate(true ,1,1)), "9101");
		
		test.same(Utils.toHex(Header.generate(false,1,255)), "11ff");
		test.same(Utils.toHex(Header.generate(false,1,255)), "11ff");
		test.same(Utils.toHex(Header.generate(true ,1,255)), "91ff");

		//2 byte ctr !x
		test.same(Utils.toHex(Header.generate(false,0,256)), "200100");
		test.same(Utils.toHex(Header.generate(false,0,256)), "200100");
		test.same(Utils.toHex(Header.generate(true ,0,256)), "a00100");

		test.same(Utils.toHex(Header.generate(false,1,256)), "210100");
		test.same(Utils.toHex(Header.generate(false,1,257)), "210101");
		test.same(Utils.toHex(Header.generate(true ,1,257)), "a10101");

		//4 byte ctr !x
		test.same(Utils.toHex(Header.generate(false,0,0xff000000)), "40ff000000");
		test.same(Utils.toHex(Header.generate(false,0,0xff010203)), "40ff010203");
		test.same(Utils.toHex(Header.generate(true ,0,0xff0000ff)), "c0ff0000ff");

		test.same(Utils.toHex(Header.generate(false,1,0xff000000)), "41ff000000");
		test.same(Utils.toHex(Header.generate(false,1,0xff010203)), "41ff010203");
		test.same(Utils.toHex(Header.generate(true ,1,0xff0000ff)), "c1ff0000ff");
		
		//1 byte ctr x k=1
		test.same(Utils.toHex(Header.generate(false,8,0)), "190800");
		test.same(Utils.toHex(Header.generate(false,8,1)), "190801");
		test.same(Utils.toHex(Header.generate(true ,8,1)), "990801");

		//1 byte ctr x k=2
		test.same(Utils.toHex(Header.generate(false,0x100,0)), "1a010000");
		test.same(Utils.toHex(Header.generate(false,0x101,1)), "1a010101");
		test.same(Utils.toHex(Header.generate(true ,0x100,1)), "9a010001");
		
		//1 byte ctr x k=3
		test.same(Utils.toHex(Header.generate(false,0xaabbcc,255)), "1baabbccff");
		test.same(Utils.toHex(Header.generate(false,0xaabbcc,255)), "1baabbccff");
		test.same(Utils.toHex(Header.generate(true ,0xaabbcc,255)), "9baabbccff");

		test.end();
	});
	
	suite.end();
});
