package com.prooftechit.vaadin.widget.lg.data;

import java.util.List;

public class LgMenuItemContext {

	private LgTableCell targetCell;
	private List<LgTableCell> selectedCellList;
	private LgMenuItem selectedMenuItem;

	public LgTableCell getTargetCell() {
		return targetCell;
	}

	public void setTargetCell(LgTableCell targetCell) {
		this.targetCell = targetCell;
	}

	public List<LgTableCell> getSelectedCellList() {
		return selectedCellList;
	}

	public void setSelectedCellList(List<LgTableCell> selectedCellList) {
		this.selectedCellList = selectedCellList;
	}

	public LgMenuItem getSelectedMenuItem() {
		return selectedMenuItem;
	}

	public void setSelectedMenuItem(LgMenuItem selectedMenuItem) {
		this.selectedMenuItem = selectedMenuItem;
	}

}
