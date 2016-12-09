package com.prooftechit.vaadin.widget.lg;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.prooftechit.vaadin.widget.lg.data.LgTableCell;

public class TableCellEvent {

	private String event;
	private List<LgTableCell> source;
	private Map<String,Object> eventParameters = new HashMap<String, Object>();

	public String getEvent() {
		return event;
	}

	public void setEvent(String event) {
		this.event = event;
	}

	public List<LgTableCell> getSource() {
		return source;
	}

	public void setSource(List<LgTableCell> source) {
		this.source = source;
	}

	public Map<String, Object> getEventParameters() {
		return eventParameters;
	}

	public void setEventParameters(Map<String, Object> eventParameters) {
		this.eventParameters = eventParameters;
	}
	
}
