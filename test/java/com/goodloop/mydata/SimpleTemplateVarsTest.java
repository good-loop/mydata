package com.goodloop.mydata;

import static org.junit.Assert.*;

import java.util.Map;

import org.junit.Test;

import com.winterwell.utils.IProperties;
import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.containers.Properties;

public class SimpleTemplateVarsTest {

	@Test
	public void testProcess() {
		{
			Map src = new ArrayMap("name", "Daniel");
			SimpleTemplateVars props = new SimpleTemplateVars(src);
			String s = props.process("Hello $name!\n\nHow are you ${name}?");
			assertEquals("Hello Daniel!\n\nHow are you Daniel?", s);
		}
	}
	
	@Test
	public void testProcessScript() {
		{
			Map src = new ArrayMap("name", "Daniel");
			SimpleTemplateVars props = new SimpleTemplateVars(src);
			String s = props.process("Hello ${name}!");
			assertEquals("Hello Daniel!", s);
		}
		{	// ?
			Map src = new ArrayMap("name", "Daniel");
			SimpleTemplateVars props = new SimpleTemplateVars(src);
			String s = props.process("Hello ${window.name? name : ''}!");
			assertEquals("Hello Daniel!", s);
		}
		{	// unset!
			Map src = new ArrayMap("name", "Daniel");
			SimpleTemplateVars props = new SimpleTemplateVars(src);
			String s = props.process("Hello ${window.foo? foo : 'dev'}!");
			assertEquals("Hello dev!", s);
		}
	}
		

}
