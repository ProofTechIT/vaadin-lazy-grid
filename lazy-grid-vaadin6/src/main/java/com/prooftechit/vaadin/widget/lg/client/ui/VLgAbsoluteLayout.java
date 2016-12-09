package com.prooftechit.vaadin.widget.lg.client.ui;

import java.util.HashSet;
import java.util.Set;

import com.google.gwt.i18n.client.NumberFormat;
import com.google.gwt.user.client.DOM;
import com.google.gwt.user.client.Element;
import com.google.gwt.user.client.Event;
import com.google.gwt.user.client.EventListener;
import com.google.gwt.user.client.Timer;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.Widget;
import com.google.gwt.user.client.ui.WidgetCollection;
import com.vaadin.terminal.gwt.client.ApplicationConnection;
import com.vaadin.terminal.gwt.client.UIDL;
import com.vaadin.terminal.gwt.client.ui.VAbsoluteLayout;

public class VLgAbsoluteLayout extends VAbsoluteLayout implements LazyGridClientListener {

	public static final String VAR_LG_ZOOM = "lgZoom";
	private Set<LazyGridClient> lgClientSet = new HashSet<LazyGridClient>();
	private Element fixedCellsElement = DOM.createDiv();
	private float zoom = 1.0f;
	
	public VLgAbsoluteLayout() {
		super();
		canvas.getStyle().setProperty("overflow", "auto");
		
		getElement().getStyle().setProperty("position", "relative");
		
		fixedCellsElement.addClassName("lazy-grid-fixed-container");
		fixedCellsElement.getStyle().setProperty("position", "absolute");
		fixedCellsElement.getStyle().setProperty("top", "0");
		fixedCellsElement.getStyle().setProperty("left", "0");
		fixedCellsElement.getStyle().setProperty("width", " 0");
		fixedCellsElement.getStyle().setProperty("height", "0");
		fixedCellsElement.getStyle().setProperty("overflow", "visible");
		getElement().appendChild(fixedCellsElement);
		
		final Timer scrollTimer = new Timer() {
		     @Override
		     public void run() {
					showFrames(200);		    	 
		     }
		 };
		
		DOM.setEventListener(canvas, new EventListener() {

			@Override
			public void onBrowserEvent(Event event) {
				final int type = DOM.eventGetType(event);
				if (type != Event.ONSCROLL) {
					return;
				}
				scrollTimer.cancel();
				scrollTimer.schedule(100);
			}

		});
		DOM.sinkEvents(canvas, Event.ONSCROLL);
	}
	
	public void setZoom(float z){
		//NumberFormat fmt = NumberFormat.getDecimalFormat();
		this.zoom = z;
		
		NumberFormat f1 = NumberFormat.getFormat("#.00");
		getElement().getStyle().setProperty("zoom", f1.format(zoom));
		getElement().getStyle().setProperty("position", "relative");

//		fixedCellsElement.getStyle().setProperty("zoom", f1.format(zoom));
//		//getElement().getStyle().setProperty("zoom", f1.format(z));
//		canvas.getParentElement().getStyle().setProperty("zoom", f1.format(zoom));
//		
//		NumberFormat f2 = NumberFormat.getFormat("#");
//		setWidth(f2.format(getElement().getOffsetWidth()) + "px");
//		setHeight(f2.format(getElement().getOffsetHeight()) + "px");
	}

	public float getZoom() {
		String userAgent = getUserAgent();
		if (userAgent.toUpperCase().contains("MSIE") && userAgent.contains("8")) {
			return zoom;
		}
		return 1.0f;
	}

	private float getZoomInvers(){
		return 1/getZoom();
	}
	
	public static native String getUserAgent() /*-{
		return navigator.userAgent.toLowerCase();
	}-*/;
	
	@Override
	public void setWidth(String width) {
		if (width.endsWith("px")){
			NumberFormat f = NumberFormat.getFormat("#");
			float w = Integer.valueOf(width.replaceAll("px", "")) * 1/zoom;
			//canvas.getStyle().setProperty("width", f.format(w) + "px");
			width = f.format(w) + "px";
		}
		super.setWidth(width);
	}

	
	
	@Override
	public void setHeight(String height) {
		if (height.endsWith("px")){
			NumberFormat f = NumberFormat.getFormat("#");
			float w = Integer.valueOf(height.replaceAll("px", "")) * 1/zoom;
			//canvas.getStyle().setProperty("height", f.format(w) + "px");
			height = f.format(w) + "px";
		}
		super.setHeight(height);

	}

	@Override
	public void updateFromUIDL(UIDL uidl, ApplicationConnection client) {
		boolean hasZoom = uidl.hasAttribute(VAR_LG_ZOOM);
		if (hasZoom) {
			setZoom(Float.valueOf(uidl.getStringAttribute(VAR_LG_ZOOM)));
		}

		super.updateFromUIDL(uidl, client);
		
		lgClientSet.clear();
		WidgetCollection children = getChildren();
		for (Widget widget : children) {
			if (!(widget instanceof SimplePanel)){
				continue;
			}
			Widget c = ((SimplePanel)widget).getWidget();
			if (c instanceof LazyGridClient) {
				LazyGridClient lgClient = (LazyGridClient) c;
				lgClient.setListener(this);
				lgClientSet.add(lgClient);
			}
		}


		showFrames(-1);
	}

	@Override
	public boolean remove(Widget w) {
		if (!(w instanceof SimplePanel)){
			return super.remove(w);
		}
		Widget c = ((SimplePanel)w).getWidget();
		if (c instanceof LazyGridClient) {
			LazyGridClient lazyGrid = (LazyGridClient) c;
			lazyGrid.setListener(null);
			lgClientSet.remove((SimplePanel)w);
			clearFixedCells(lazyGrid, fixedCellsElement);
			lazyGrid.hideFrame();
		}
		return super.remove(w);
	}

	private void showFrames(int delay) {
		LgElementFrame containerFrame = getContainerFrame();
		
		for (LazyGridClient lgClient : lgClientSet) {
			LgElementFrame elementFrame = new LgElementFrame();
			
			elementFrame.setLeft(Float.valueOf(lgClient.getElement().getParentElement().getOffsetLeft() / getZoom() ).intValue());
			elementFrame.setTop(Float.valueOf(lgClient.getElement().getParentElement().getOffsetTop() / getZoom()).intValue());
			
			elementFrame.setWidth(lgClient.getElement().getOffsetWidth());
			elementFrame.setHeight(lgClient.getElement().getOffsetHeight());
			
			LgElementFrame intersection = LgUtils.calculateIntersectionFrame(containerFrame, elementFrame);
			//Window.alert(String.valueOf(intersection.getLeft()));
			lgClient.setZoom(getZoom());
			lgClient.showFrame(this, intersection, delay);
		}
	}

	@Override
	public void onTableMove(LazyGridClient client, String action, int top, int left) {
		com.google.gwt.dom.client.Element c = client.getElement().getParentElement();

		LgElementFrame containerFrame = getContainerFrame();
		
		LgElementFrame elementFrame = getTableFrame(client);
		
		int hOffsetRight = elementFrame.getLeft() + elementFrame.getWidth() - (containerFrame.getLeft() + containerFrame.getWidth());
		int vOffsetBottom = elementFrame.getTop() + elementFrame.getHeight() - (containerFrame.getTop() + containerFrame.getHeight());
		int hOffsetLeft = elementFrame.getLeft() - containerFrame.getLeft();
		int vOffsetTop = elementFrame.getTop() - containerFrame.getTop();
		
		if ("previousCell".equals(action) && left > 0){
			action = "nextCell"; 
		}
		if ("nextCell".equals(action) && left < 0){
			action = "previousCell"; 
		}
		
		if ("nextCell".equals(action) && hOffsetRight <= -5){
			return;
		} else if ("nextCell".equals(action) && left > hOffsetRight){
			left = hOffsetRight > 0 ? hOffsetRight : left;
		}  
		
		if ("nextRow".equals(action) && vOffsetBottom <= 0){
			return;
		} else if ("nextRow".equals(action) && top > vOffsetBottom){
			top = vOffsetBottom;
		}
		
		if ("previousCell".equals(action) && hOffsetLeft >= 5){
			return;
		} else if ("previousCell".equals(action) && left < hOffsetLeft){
			left = hOffsetLeft < 0 ? hOffsetLeft : left;
		}
		
		if ("previousRow".equals(action) && vOffsetTop >= 0){
			return;
		} else if ("previousRow".equals(action) && top < vOffsetTop){
			top = vOffsetTop;
		}
//
//		Window.alert(String.valueOf(left));
//		Window.alert(String.valueOf(top));
//		
//		Window.alert(String.valueOf(containerFrame.getLeft() + left));
//		Window.alert(String.valueOf(containerFrame.getTop() + top));
		
		if (left != 0){
			canvas.setScrollLeft(Float.valueOf((containerFrame.getLeft() + left)).intValue());
		}
		if (top != 0){
			canvas.setScrollTop(Float.valueOf((containerFrame.getTop() + top)).intValue());
		}
		
	}

	private LgElementFrame getContainerFrame() {
		return getContainerFrame(1.0f, 1.0f);
	}
	
	private LgElementFrame getContainerFrame(float zoomPosition, float zoomSize) {
		LgElementFrame containerFrame = new LgElementFrame();
		containerFrame.setLeft(Float.valueOf(canvas.getScrollLeft() * zoomPosition).intValue());
		containerFrame.setTop(Float.valueOf(canvas.getScrollTop() * zoomPosition).intValue());
		containerFrame.setWidth(Float.valueOf(canvas.getOffsetWidth() * zoomSize).intValue());
		containerFrame.setHeight(Float.valueOf(canvas.getOffsetHeight() * zoomSize).intValue());
		return containerFrame;
	}

	@Override
	public void onFixedCells(VLazyGrid client, String sEventData) {
		LgElementFrame tableElementFrame = getTableFrame(client);
		LgElementFrame containerFrame = getContainerFrame(getZoom(), 1.0f);

		int fixedContainerOffsetLeft = containerFrame.getLeft() > tableElementFrame.getLeft() ? 0
				: tableElementFrame.getLeft() - containerFrame.getLeft();
		int fixedContainerOffsetTop = containerFrame.getTop() > tableElementFrame.getTop() ? 0
				: tableElementFrame.getTop() - containerFrame.getTop();

		drawFixedCells(client, fixedCellsElement, (int) fixedContainerOffsetLeft, (int) fixedContainerOffsetTop,
				sEventData);
	}

	private LgElementFrame getTableFrame(LazyGridClient client) {
		LgElementFrame tableElementFrame = new LgElementFrame();
		
		tableElementFrame.setLeft(client.getElement().getParentElement().getOffsetLeft());
		tableElementFrame.setTop(client.getElement().getParentElement().getOffsetTop());
		
		tableElementFrame.setWidth(client.getElement().getOffsetWidth());
		tableElementFrame.setHeight(client.getElement().getOffsetHeight());
		return tableElementFrame;
	}

	private native void clearFixedCells(LazyGridClient lazyGrid, Element fixedCellElement)/*-{
		var fixedCellPlugin = $wnd.$(fixedCellElement).fixedCells({
																	operation: 'delete',
																	tableId: lazyGrid.lazyGridInstance.tableIdSalt
																});
	}-*/;

	
	private native String drawFixedCells(LazyGridClient lazyGrid, Element fixedCellElement, int tableLeft, int tableTop, String sEventData)/*-{
		var eventData = {};
		eventData = $wnd.jQuery.parseJSON(sEventData);
		eventData.tableOffsetLeft = tableLeft;
 		eventData.tableOffsetTop = tableTop;
 		
 		var fixedCellPlugin = $wnd.$(fixedCellElement);
 		var fixedCellsResult = fixedCellPlugin.fixedCells(eventData);
 		
// 		fixedCellPlugin.on('clickFixedCell', function(e, cellElement)
//		{
//			lazyGrid.lazyGridPlugin.lazyGrid.clickFixedCell(cellElement);
//			
//		});

 		
		lazyGrid.lazyGridPlugin.lazyGrid.addServerCellRange(fixedCellsResult.cellRanges);
		lazyGrid.lazyGridPlugin.lazyGrid.setFixedOverlap(fixedCellsResult.overlapTop, fixedCellsResult.overlapLeft);
		
		return  $wnd.$.toJSON(fixedCellsResult.cellRanges);
	}-*/;

	
}
