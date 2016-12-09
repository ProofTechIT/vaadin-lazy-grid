package com.prooftechit.vaadin.widget.lg.demo;

import com.prooftechit.vaadin.widget.lg.data.LgCellContentType.LgCellContentText;

public class LgCellContentSeparateChars extends LgCellContentText {

	public static final String TYPE_PARAMETER_MAX_LENGTH = "maxLength";

	public LgCellContentSeparateChars() {
		super();
		typeParameters.put(TYPE_PARAMETER_MAX_LENGTH, String.valueOf(4));
	}

	@Override
	public String formatValue(Object value) {
		StringBuffer result = new StringBuffer();

		String sValue = (String) value;
		char[] charArray = sValue.toCharArray();
		int maxLength = Integer.valueOf(typeParameters.get(TYPE_PARAMETER_MAX_LENGTH));
		for (int i = 0; i < charArray.length; i++) {
			if (i == maxLength) {
				break;
			}
			result.append(String.format("<div class=\"square-frame-text\">%s</div>", charArray[i]));
		}
		return result.toString();
	}

}
