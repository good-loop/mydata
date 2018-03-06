package com.goodloop.mydata;

import java.io.File;
import java.util.Map;
import java.util.concurrent.Callable;

import com.winterwell.utils.io.FileUtils;
import com.winterwell.utils.web.WebUtils;

public class LetterGenerator implements Callable<File> {

	File template;
	
	Map<String, ?> vars;
	
	public LetterGenerator(File template, Map<String, ?> vars) {
		this.template = template;
		this.vars = vars;
	}

	@Override
	public File call() throws Exception {
		String html = FileUtils.read(template);
		
		// set vars
		if (vars!=null) {
			SimpleTemplateVars stv = new SimpleTemplateVars(vars);
			html = stv.process(html);
		}
		
		File file = File.createTempFile("letter", ".pdf");
		WebUtils.renderToPdf(html, file, true);
		return file;
	}

	
}
