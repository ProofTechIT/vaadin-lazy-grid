package com.prooftechit.vaadin.widget.lg.data;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

public class LgTableCellValue {

	private Object value;
	private LgCellContentType contentType;

	public LgTableCellValue() {
		this(new LgCellContentType.LgCellContentLabel());
	}
	
	@JsonCreator
	public LgTableCellValue(@JsonProperty("contentType")LgCellContentType contentType) {
		super();
		this.contentType = contentType;
	}
	
	@JsonGetter
	public LgCellContentType getContentType() {
		return contentType;
	}

	public void setValue(Object value) {
		this.value = value;
	}

	@JsonDeserialize(using=TableCellValueDeserializer.class)
	public Object getValue() {
		return value;
	}

	@JsonGetter
	public String getContentValue() {
		return contentType.formatValue(value);
	}
}
