package com.prooftechit.vaadin.widget.lg.demo;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;

import com.vaadin.ui.Button;
import com.vaadin.ui.Label;
import com.vaadin.ui.TextField;
import com.vaadin.ui.VerticalLayout;

import com.prooftechit.vaadin.widget.lg.LazyGrid;
import com.prooftechit.vaadin.widget.lg.LgAbsoluteLayout;
import com.prooftechit.vaadin.widget.lg.data.LgCellContentType;
import com.prooftechit.vaadin.widget.lg.data.LgTableCellRange;
import com.prooftechit.vaadin.widget.lg.data.LgTableColumn;
import com.prooftechit.vaadin.widget.lg.data.LgTableMeta;
import com.prooftechit.vaadin.widget.lg.data.LgTableRow;

public class LazyGridContainerScroll extends LgAbsoluteLayout {

	public LazyGridContainerScroll() {
		super();
		//init();
	}

	public void init() {
		setZoom(1.2f);
		addStyleName("lazy-grid-container-scroll");
		//setWidth("100%");
		setHeight("600px");
		//setSizeFull();
		
//		for (int i = 0; i < 10; i++) {
//			LazyGrid lg = createLazyGridTable(1000, 250, 10000, 10000, i == 0);
//			int left = i * 1010 + 10;
//			int top = 30;
//			addComponent(lg, String.format("left: %spx; top: %spx;", left, top));			
//		}

		//1665
		//for (int i = 0; i < 100; i++) {
			LazyGrid lg = createLazyGridTable(99900, 2500, 1665, 100, true);
			int top = 380;
			addComponent(lg, String.format("left: %spx; top: %spx;", 50, top));			
		//}
		
		Label endLabel = new Label("end");
		endLabel.setWidth("100px");
		addComponent(endLabel, "left: 100100px; top: 600px;");

		Button button = new Button();
		button.setCaption("button");
		addComponent(button, "left: 100100px; top: 520px;");

		TextField textField = new TextField("TESTiNput");
		textField.setWidth("100px");
		addComponent(textField, "left: 100100px; top: 540px;");

		VerticalLayout verticalLayout = new VerticalLayout();
		verticalLayout.setWidth(100, UNITS_PIXELS);
		verticalLayout.setHeight(50, UNITS_PIXELS);
		addComponent(verticalLayout, "left: 100100px; top: 560px;");

	}

	private LazyGrid createLazyGridTable(int width, int height, int col, int row, boolean useFixed) {
		LazyGrid lgContainerScroll = new LazyGrid(
				new TMTableCellProvider(
						new HashSet<String>(Arrays.asList(new String[] { LgCellContentType.LgCellContentNumber.LG_CELL_CONTENT_NUMBER,
								LgCellContentType.LgCellContentLabel.LG_CELL_CONTENT_LABEL }))));
		lgContainerScroll.setCellDataProvider(new TMCellDataProvider());
		
		lgContainerScroll.setWidth(String.format("%spx", width));
		lgContainerScroll.setHeight(String.format("%spx", height));
		
		LgTableMeta tableMeta = new LgTableMeta();

		
		
		tableMeta.setColCount(col);
		tableMeta.setRowCount(row);
		
		if (!useFixed){
			lgContainerScroll.setTableMeta(tableMeta);
			lgContainerScroll.reload();
			return lgContainerScroll;
		}

		ArrayList<LgTableCellRange> cellSpanList = new ArrayList<LgTableCellRange>();
		tableMeta.setCellSpanList(cellSpanList);

		LgTableCellRange intersectionRange = new LgTableCellRange();
		cellSpanList.add(intersectionRange);
		
		intersectionRange.setLeft(4);
		intersectionRange.setTop(2);
		intersectionRange.setRight(5);
		intersectionRange.setBottom(2);
		
		LgTableRow headerRow = new LgTableRow();
		tableMeta.getRowList().add(headerRow);

		headerRow.getStyleNameSet().add("sb-header");
		headerRow.setFixed(Boolean.TRUE);
		//headerRow.setHeight(74);

		headerRow = new LgTableRow();
		tableMeta.getRowList().add(headerRow);
		
		headerRow.setIndex(1);
		headerRow.getStyleNameSet().add("sb-header");
		headerRow.setFixed(Boolean.TRUE);
		//headerRow.setHeight(74);

		LgTableRow subtotalRow = new LgTableRow();
		tableMeta.getRowList().add(subtotalRow);

		subtotalRow.setIndex(10);
		subtotalRow.setFixed(Boolean.TRUE);
		
		LgTableColumn headerCol = new LgTableColumn();
		tableMeta.getColumnList().add(headerCol);

		headerCol.getStyleNameSet().add("sb-header");
		headerCol.setFixed(Boolean.TRUE);
		//headerCol.setWidth(180);

		headerCol = new LgTableColumn();
		tableMeta.getColumnList().add(headerCol);

		headerCol.setIndex(1);
		headerCol.getStyleNameSet().add("sb-header");
		headerCol.setFixed(Boolean.TRUE);
		//headerCol.setWidth(180);

		lgContainerScroll.setTableMeta(tableMeta);
		lgContainerScroll.reload();

		return lgContainerScroll;
	}
	
}
