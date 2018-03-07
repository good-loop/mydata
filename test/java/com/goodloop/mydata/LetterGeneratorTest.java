package com.goodloop.mydata;

import static com.winterwell.utils.StrUtils.newLine;
import static org.junit.Assert.*;

import java.io.BufferedReader;
import java.io.File;
import java.util.Map;

import org.junit.Test;

import com.winterwell.depot.Depot;
import com.winterwell.depot.Desc;
import com.winterwell.maths.vector.XTest;
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

public class LetterGeneratorTest {

	@Test
	public void testCall() throws Exception {
		File template = new File("web/getdata-letter-print.html");
		Map<String, ?> vars = new ArrayMap(			
			"name", "Daniel Winterstein",
			"email", "daniel@sodash.com",
			"address", "27 McDonald Road, Edinburgh, EH7 4LX",
			"customerId", null,
			"hat", null,
			"companyName", "Google",
			"companyAddress", "Where are Google<br>Somewhere<br>W4 4NS",
			"date", new Time().format("d MMMMMM, yyyy")
				);
		LetterGenerator lg = new LetterGenerator(template, vars);
		File f = lg.call();
		WebUtils.display(f);
		
		Desc<File> desc = new Desc("register-of-data-controllers", File.class);
		desc.put("date", "2018-03-07");
		desc.setTag("mydata");
		File dataFileZip = Depot.getDefault()
				.setErrorPolicy(KErrorPolicy.ASK)
				.get(desc);
		if (dataFileZip==null) {
			FakeBrowser fb = new FakeBrowser();
			dataFileZip = fb.getFile("https://ico.org.uk/media/about-the-ico/data-sets/register-of-data-controllers/register-of-data-controllers_2018-03-07.zip");
			Depot.getDefault().put(desc, dataFileZip);
		}
		BufferedReader r = FileUtils.getZIPReader(dataFileZip);
		CSVReader csvr = new CSVReader(r, new CSVSpec());
		Printer.out(csvr.next());
		Printer.out(csvr.next());
		csvr.close();
		r.close();
	}

}
