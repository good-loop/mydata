package com.goodloop.mydata;

import static com.winterwell.utils.StrUtils.newLine;
import static org.junit.Assert.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.junit.Test;

import com.winterwell.depot.Depot;
import com.winterwell.depot.Desc;
import com.winterwell.maths.vector.XTest;
import com.winterwell.profiler.client.ProfilerClient;
import com.winterwell.profiler.data.Person;
import com.winterwell.profiler.data.PostalAddress;
import com.winterwell.utils.Printer;
import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.io.CSVReader;
import com.winterwell.utils.io.CSVSpec;
import com.winterwell.utils.io.FileUtils;
import com.winterwell.utils.log.KErrorPolicy;
import com.winterwell.utils.time.Time;
import com.winterwell.utils.time.TimeUtils;
import com.winterwell.utils.web.WebUtils;
import com.winterwell.web.FakeBrowser;
import com.winterwell.web.data.XId;

public class LetterGeneratorTest {

	@Test
	public void testGetCompanyAddress() throws IOException {
		String[] cns = 
//			"asda".split(" ");
			"google tesco sainsbury asda morrisons aldi amazon microsoft facebook apple".split(" ");
		for(String c : cns) {
			List gs = ICORegistry.getData(c);
			Printer.out(gs);
			assert ! gs.isEmpty();
			assert gs.size() == 1 : gs;
		}
	}
	
	
	@Test
	public void testProcess() throws Exception {
		String[] users = "daniel@sodash.com@email ".split(" ");
		
		for(String uxid : users) {
			GetMyDataLetterGenerator lg = new GetMyDataLetterGenerator(new XId(uxid));
			lg.call();
		}
	}
	
	@Test
	public void testCall() throws Exception {
		File template = new File("web/getdata-letter-print.html");
		
		List<PostalAddress> addr = ICORegistry.getData("Google");
		String address = addr.get(0).toString();  
				
		Map<String, ?> vars = new ArrayMap(			
			"name", "Daniel Winterstein",
			"email", "daniel@sodash.com",
			"address", "27 McDonald Road, Edinburgh, EH7 4LX",
			"customerId", null,
			"hat", null,
			"companyName", "Google",
			"companyAddress", address,
			"date", new Time().format("d MMMMMM, yyyy")
				);
		LetterGenerator lg = new LetterGenerator(template, vars);
		File f = lg.call();
		WebUtils.display(f);		
	}

}
