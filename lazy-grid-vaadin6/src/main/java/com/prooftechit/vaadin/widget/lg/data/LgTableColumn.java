package com.prooftechit.vaadin.widget.lg.data;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class LgTableColumn {

	private Integer index = 0;
	private Boolean fixed = Boolean.FALSE;
	private List<LgTableRow> rowList;
	private Integer width = 60;
	private Set<String> styleNameSet = new HashSet<String>();

	public Integer getIndex() {
		return index;
	}

	public void setIndex(Integer index) {
		this.index = index;
	}

	public Boolean getFixed() {
		return fixed;
	}

	public void setFixed(Boolean fixed) {
		this.fixed = fixed;
	}

	public Integer getWidth() {
		return width;
	}

	public void setWidth(Integer width) {
		this.width = width;
	}

	public List<LgTableRow> getRowList() {
		return rowList;
	}

	public void setRowList(List<LgTableRow> rowList) {
		this.rowList = rowList;
	}

	public Set<String> getStyleNameSet() {
		return styleNameSet;
	}

	public void setStyleNameSet(Set<String> styleSet) {
		this.styleNameSet = styleSet;
	}

}
