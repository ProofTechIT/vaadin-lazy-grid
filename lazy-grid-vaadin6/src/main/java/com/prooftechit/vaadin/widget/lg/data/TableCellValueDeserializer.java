package com.prooftechit.vaadin.widget.lg.data;

import java.io.IOException;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

public class TableCellValueDeserializer extends StdDeserializer<Object> {
	
	public TableCellValueDeserializer() {
		super(LgTableCell.class);
	}

	@Override
	public Object deserialize(JsonParser p, DeserializationContext ctxt)
			throws IOException, JsonProcessingException {
		ObjectMapper mapper = (ObjectMapper) p.getCodec();
		JsonNode root = mapper.readTree(p);
		
		LgTableCellValue cell = (LgTableCellValue) p.getCurrentValue();
		Class<? extends Object> cellValueClass = cell.getContentType().getDefaultValue().getClass();
		//cell.setValue(mapper.treeToValue(root, cellValueClass));
		return mapper.treeToValue(root, cellValueClass);
	}
	
	
}
