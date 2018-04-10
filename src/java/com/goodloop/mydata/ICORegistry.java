package com.goodloop.mydata;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.winterwell.depot.Depot;
import com.winterwell.depot.Desc;
import com.winterwell.profiler.data.Person;
import com.winterwell.profiler.data.PostalAddress;
import com.winterwell.utils.Printer;
import com.winterwell.utils.StrUtils;
import com.winterwell.utils.Utils;
import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.io.CSVReader;
import com.winterwell.utils.io.CSVSpec;
import com.winterwell.utils.io.FileUtils;
import com.winterwell.utils.log.KErrorPolicy;
import com.winterwell.web.FakeBrowser;

public class ICORegistry {

	static Map<String,String> regnoFromShortCommonName = new ArrayMap(
			"tesco", "Z6712178", // stores
			"google", "Z6647359", // UK
			"amazon", "ZA033296", // one of the UK (itsa mess)
			"apple", "ZA054298", // UK 
			"sainsbury", "Z4722394", // supermarkets
			"asda", "Z7545987",
			"morrison", "Z5225696",
//			"facebook",
			"aldi", "Z5724527",
			"microsoft", "Z6296785",
			"", ""
			);
	
	public static List<PostalAddress> getData(String companyName) throws IOException {
		String cn = companyName.toLowerCase().trim();
		if (cn.endsWith("s")) cn = cn.substring(0, cn.length()-1);
		String regno = regnoFromShortCommonName.get(cn);
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
		Printer.out(dataFileZip);
				
		try (BufferedReader r = FileUtils.getZIPReader(dataFileZip)) {
			CSVReader csvr = new CSVReader(r, new CSVSpec());
			Printer.out(csvr.next()); // headers
	//		Printer.out(csvr.next());		
			List<PostalAddress> lines = new ArrayList();
			// Registration_number, Organisation_name, Companies_House_number, Organisation_address_line_1, Organisation_address_line_2, 
			// Organisation_address_line_3, Organisation_address_line_4, Organisation_address_line_5, Organisation_postcode, Organisation_country, 
			// Freedom_of_Information_flag, Start_date_of_registration, End_date_of_registration, Exempt_processing_flag, Trading_names, 
			// C1_Title, C1_First_name, C1_Last_name, C1_Address_line_1, C1_Address_line_2, 
			// C1_Address_line_3, C1_Address_line_4, C1_Address_line_5, C1_Telephone, C1_Postcode, 
			// C1_Email_address, C1_Job_title, Public_register_entry_URL
			for (String[] line : csvr) {
				if (line.length < 2) continue;
				if (regno != null) {
					if (line[0].equals(regno)) {
						lines.add(pa(line));
						break;
					}
					continue;
				}
				if (line[1].toLowerCase().contains(cn)) {
					lines.add(pa(line));
				}
			}
			csvr.close();
			return lines;
		}		
	}

	private static PostalAddress pa(String[] line) {
		// Registration_number, Organisation_name, Companies_House_number, Organisation_address_line_1, Organisation_address_line_2, 
		// 5 Organisation_address_line_3, Organisation_address_line_4, Organisation_address_line_5, Organisation_postcode, Organisation_country, 
		// 10 Freedom_of_Information_flag, Start_date_of_registration, End_date_of_registration, Exempt_processing_flag, Trading_names, 
		// 15 C1_Title, C1_First_name, C1_Last_name, C1_Address_line_1, C1_Address_line_2, 
		// 20 C1_Address_line_3, C1_Address_line_4, C1_Address_line_5, C1_Telephone, C1_Postcode, 
		// 25 C1_Email_address, C1_Job_title, Public_register_entry_URL
		PostalAddress pa = new PostalAddress();
		
		if ( ! Utils.isBlank(line[16]) || ! Utils.isBlank(line[26])) {
			assert false : Printer.out(line);
		}
		
		pa.setStreetAddress(line[3]);
		String lines = StrUtils.joinWithSkip("\n", line[4], line[5], line[6], line[7]);
		pa.setAddressLocality(lines);
		pa.setPostalCode(line[8]);
		return pa;
	}

}
