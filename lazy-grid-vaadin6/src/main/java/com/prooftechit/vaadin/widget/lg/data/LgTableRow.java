package com.prooftechit.vaadin.widget.lg.data;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class LgTableRow {

	private Integer index = 0;
	private Boolean fixed = Boolean.FALSE;
	private Integer height = 25;
	private List<LgTableColumn> columnList;
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

	public Integer getHeight() {
		return height;
	}

	public void setHeight(Integer height) {
		this.height = height;
	}

	public List<LgTableColumn> getColumnList() {
		return columnList;
	}

	public void setColumnList(List<LgTableColumn> columnList) {
		this.columnList = columnList;
	}

	public Set<String> getStyleNameSet() {
		return styleNameSet;
	}

	public void setStyleNameSet(Set<String> styleSet) {
		this.styleNameSet = styleSet;
	}

}
