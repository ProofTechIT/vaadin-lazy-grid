package com.prooftechit.vaadin.widget.lg.demo;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

import com.vaadin.ui.GridLayout;
import com.vaadin.ui.Window.Notification;

import com.prooftechit.vaadin.widget.lg.LazyGrid;
import com.prooftechit.vaadin.widget.lg.TableCellEvent;
import com.prooftechit.vaadin.widget.lg.TableCellEventListener;
import com.prooftechit.vaadin.widget.lg.data.LgCellContentType;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;
import com.prooftechit.vaadin.widget.lg.data.LgTableCellRange;
import com.prooftechit.vaadin.widget.lg.data.LgTableMeta;

public class LazyGridContainer extends GridLayout implements TableCellEventListener {

	public LazyGridContainer() {
		super(4, 4);
		init();
	}

	private void init() {
		LgTableMeta metaTableA = tableA();
		LazyGrid tableA = new LazyGrid(createCellProvider());
		tableA.setTableMeta(metaTableA);
		addComponent(tableA, 0, 0);

		tableA.setCellEventListener(this);
		tableA.setCellDataProvider(new TMCellDataProvider());
		tableA.setWidth("100%");
		tableA.setHeight("250px");

		LgTableMeta metaTableB = tableB();
		LazyGrid tableB = new LazyGrid(createCellProvider());
		tableB.setTableMeta(metaTableB);
		addComponent(tableB, 0, 1);

		tableB.setCellEventListener(this);
		tableB.setCellDataProvider(new TMCellDataProvider());
		tableB.setWidth("100%");
		tableB.setHeight("250px");

		LgTableMeta metaTableC = tableC();
		LazyGrid tableC = new LazyGrid(createCellProvider());
		tableC.setTableMeta(metaTableC);
		addComponent(tableC, 1, 0);

		tableC.setCellEventListener(this);
		tableC.setCellDataProvider(new TMCellDataProvider());
		tableC.setWidth("100%");
		tableC.setHeight("250px");

		LgTableMeta metaTableD = tableD();
		LazyGrid tableD = new LazyGrid(createCellProvider());
		tableD.setTableMeta(metaTableD);
		addComponent(tableD, 1, 1);

		tableD.setCellEventListener(this);
		tableD.setCellDataProvider(new TMCellDataProvider());
		tableD.setWidth("100%");
		tableD.setHeight("250px");

		setColumnExpandRatio(0, 0.5f);
		setColumnExpandRatio(1, 0.5f);
	}

	private TMTableCellProvider createCellProvider() {
		return new TMTableCellProvider();
	}

	private LgTableMeta tableA() {
		LgTableMeta result = new LgTableMeta();
		result.setColCount(1000);
		result.setRowCount(1000);

		ArrayList<LgTableCellRange> cellSpanList = new ArrayList<LgTableCellRange>();
		result.setCellSpanList(cellSpanList);

		LgTableCellRange intersectionRange = new LgTableCellRange();
		cellSpanList.add(intersectionRange);

		intersectionRange.setLeft(0);
		intersectionRange.setTop(0);
		intersectionRange.setRight(1);
		intersectionRange.setBottom(1);

		for (int i = 2; i < 1000; i += 2) {
			LgTableCellRange subheaderRange = new LgTableCellRange();
			cellSpanList.add(subheaderRange);

			subheaderRange.setLeft(i);
			subheaderRange.setTop(1);
			subheaderRange.setRight(i + 1);
			subheaderRange.setBottom(1);
		}

		return result;
	}

	private LgTableMeta tableB() {
		LgTableMeta result = new LgTableMeta();
		result.setColCount(20);
		result.setRowCount(100);

		ArrayList<LgTableCellRange> cellSpanList = new ArrayList<LgTableCellRange>();
		result.setCellSpanList(cellSpanList);

		LgTableCellRange cellSpanRange = new LgTableCellRange();
		cellSpanList.add(cellSpanRange);

		cellSpanRange.setLeft(0);
		cellSpanRange.setTop(0);
		cellSpanRange.setRight(10);
		cellSpanRange.setBottom(0);
		
		cellSpanRange = new LgTableCellRange();
		cellSpanList.add(cellSpanRange);

		cellSpanRange.setLeft(10);
		cellSpanRange.setTop(0);
		cellSpanRange.setRight(99);
		cellSpanRange.setBottom(9);
		
		cellSpanRange = new LgTableCellRange();
		cellSpanList.add(cellSpanRange);

		cellSpanRange.setLeft(0);
		cellSpanRange.setTop(9);
		cellSpanRange.setRight(10);
		cellSpanRange.setBottom(9);
		
		cellSpanRange = new LgTableCellRange();
		cellSpanList.add(cellSpanRange);

		cellSpanRange.setLeft(0);
		cellSpanRange.setTop(0);
		cellSpanRange.setRight(0);
		cellSpanRange.setBottom(9);

		cellSpanRange = new LgTableCellRange();
		cellSpanList.add(cellSpanRange);

		cellSpanRange.setLeft(5);
		cellSpanRange.setTop(0);
		cellSpanRange.setRight(5);
		cellSpanRange.setBottom(9);
		
		cellSpanRange = new LgTableCellRange();
		cellSpanList.add(cellSpanRange);

		cellSpanRange.setLeft(5);
		cellSpanRange.setTop(5);
		cellSpanRange.setRight(10);
		cellSpanRange.setBottom(9);
		
		return result;
	}

	private LgTableMeta tableC() {
		LgTableMeta result = new LgTableMeta();
		result.setColCount(1000);
		result.setRowCount(1000);
		return result;
	}

	private LgTableMeta tableD() {
		LgTableMeta result = new LgTableMeta();
		result.setColCount(1000);
		result.setRowCount(1000);
		return result;
	}

	@Override
	public List<LgTableCell> handleEvent(TableCellEvent event) {
		StringBuffer sb = new StringBuffer();
		sb.append(event.getEvent()).append(": ");
		for (LgTableCell lgTableCell : event.getSource()) {
			sb.append("[").append(lgTableCell.getValue()).append("]");
		}
		getWindow().showNotification(sb.toString(), Notification.TYPE_TRAY_NOTIFICATION);
		return event.getSource();
	}

}
