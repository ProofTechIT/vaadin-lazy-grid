package com.prooftechit.vaadin.widget.lg.data;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonGetter;

public class LgTableCell {

	public Integer rowIndex;
	public Integer colIndex;
	public LgTableCellValue value = new LgTableCellValue();
	public Set<String> styleNameSet = new HashSet<String>();
	public String style;
	public Boolean editable = Boolean.TRUE;
	public Boolean contextMenuEnable = Boolean.TRUE;

	public Integer getRowIndex() {
		return rowIndex;
	}

	public void setRowIndex(Integer rowId) {
		this.rowIndex = rowId;
	}

	public Integer getColIndex() {
		return colIndex;
	}

	public void setColIndex(Integer colId) {
		this.colIndex = colId;
	}

	public LgTableCellValue getValue() {
		return value;
	}

	public void setValue(LgTableCellValue value) {
		this.value = value;
	}

	@JsonGetter
	public LgCellContentType getContentType() {
		return value.getContentType();
	}

	@JsonGetter
	public String getContentValue() {
		return value == null ? "" : value.getContentValue();
	}
	
	public Set<String> getStyleNameSet() {
		return styleNameSet;
	}

	public void setStyleNameSet(Set<String> styleSet) {
		this.styleNameSet = styleSet;
	}

	public String getStyle() {
		return style;
	}

	public void setStyle(String style) {
		this.style = style;
	}

	public Boolean getEditable() {
		return editable;
	}

	public void setEditable(Boolean editable) {
		this.editable = editable;
	}

	public Boolean getContextMenuEnable() {
		return contextMenuEnable;
	}

	public void setContextMenuEnable(Boolean contextMenuEnable) {
		this.contextMenuEnable = contextMenuEnable;
	}

}
