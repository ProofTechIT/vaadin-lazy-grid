package com.prooftechit.vaadin.widget.lg.client.ui;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.google.gwt.dom.client.Document;
import com.google.gwt.user.client.DOM;
import com.google.gwt.user.client.Element;
import com.google.gwt.user.client.Event;
import com.google.gwt.user.client.EventListener;
import com.google.gwt.user.client.Timer;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Widget;
import com.vaadin.terminal.gwt.client.ApplicationConnection;
import com.vaadin.terminal.gwt.client.Paintable;
import com.vaadin.terminal.gwt.client.UIDL;
import com.vaadin.ui.ClientWidget;
import com.vaadin.ui.ClientWidget.LoadStyle;

@ClientWidget(value = VLazyGrid.class, loadStyle = LoadStyle.EAGER)
public class VLazyGrid extends Widget implements Paintable, LazyGridClient {

	public static final String VAR_TABLE_RELOAD = "lgTableReload";
	public static final String VAR_TABLE_META = "lgTableMeta";
	public static final String VAR_TABLE_CELL_EVENT = "lgTableCellEvent";
	public static final String VAR_LOAD_CELL_LIST_REQUEST = "lgLoadCellListRequest";
	public static final String VAR_LOAD_CELL_LIST_RESPONSE = "lgLoadCellListResponse";
	public static final String VAR_LOAD_CELL_DATA_REQUEST = "lgLoadCellDataRequest";
	public static final String VAR_LOAD_CELL_DATA_RESPONSE = "lgLoadCellDataResponse";
	public static final String VAR_UPDATE_TABLE_CELL_RESPONSE = "lgUpdateTableCellResponse";
	public static final String VAR_LOAD_CELL_MENU_ITEM_LIST_REQUEST = "lgLoadCellMenuItemListRequest";
	public static final String VAR_LOAD_CELL_MENU_ITEM_LIST_RESPONSE = "lgLoadCellMenuItemListResponse";
	public static final String VAR_MENU_ITEM_SELECT_REQUEST = "lgMenuItemSelectRequest";

	private ApplicationConnection client;
	private String pid;
	private Map<Object, LgElementFrame> layerFrameMap = new HashMap<Object, LgElementFrame>();
	private boolean eagerReload = true;
	final Element content = DOM.createDiv();
	private String sTableMeta;
	private boolean frameVisible;
	private Element fixedCellsElement = DOM.createDiv();
	private LazyGridClientListener listener;
	private float zoom = 1f;

	private class ScrollTimer extends Timer {

		 private Object frameId;
		 private LgElementFrame frame;
		
	     @Override
	     public void run() {
			
			showFrameInternal(frameId, frame);
	     }
		
	}
	
	final ScrollTimer scrollTimer = new ScrollTimer();
	
	public VLazyGrid() {
		super();
		setElement(Document.get().createDivElement());
		content.addClassName("lazy-grid");
		content.getStyle().setProperty("position", "relative");
		content.getStyle().setProperty("overflow", "auto");
		//content.getStyle().setProperty("width", "100%");
		//content.getStyle().setProperty("height", "100%");
		
		getElement().appendChild(content);
		
		fixedCellsElement.getStyle().setProperty("position", "absolute");
		fixedCellsElement.getStyle().setProperty("top", "0");
		fixedCellsElement.getStyle().setProperty("left", "0");
		fixedCellsElement.getStyle().setProperty("width", " 0");
		fixedCellsElement.getStyle().setProperty("height", "0");
		fixedCellsElement.getStyle().setProperty("overflow", "visible");
		getElement().appendChild(fixedCellsElement);
		
		DOM.setEventListener(content, new EventListener() {

			@Override
			public void onBrowserEvent(Event event) {
				final int type = DOM.eventGetType(event);
				log("event-[" + type + "]");
				if (type != Event.ONSCROLL) {
					return;
				}
				
				LgElementFrame containerFrame = getContainerFrame();
				LgElementFrame elementFrame = getElementFrame();
				
				LgElementFrame intersection = elementFrame == null ? null : LgUtils.calculateIntersectionFrame(containerFrame, elementFrame);
				
				showFrame(VLazyGrid.this, intersection, 100);
			}

		});
		DOM.sinkEvents(content, Event.ONSCROLL);
	}

	public float getZoom() {
		return zoom;
	}



	public void setZoom(float zoom) {
		this.zoom = zoom;
	}

	public LazyGridClientListener getListener() {
		return listener;
	}

	public void setListener(LazyGridClientListener listener) {
		this.listener = listener;
	}

	@Override
	protected void onAttach() {
		super.onAttach();
		Widget parent = getParent();
		while (parent != null) {
			if (parent instanceof VLgAbsoluteLayout){
				this.eagerReload = false;
				break;
			}
			parent = parent.getParent();
		}
	}

	public void updateFromUIDL(UIDL uidl, ApplicationConnection client) {
		log("updateFromUIDL: pid-[" + client.getPid(this) + "]");
		
		if (client.updateComponent(this, uidl, true)) {
			log("updateFromUIDL skip: pid-[" + client.getPid(this) + "]");
			return;
		}

		pid = client.getPid(this);

		content.getStyle().setProperty("width", getElement().getStyle().getProperty("width"));
		content.getStyle().setProperty("height", getElement().getStyle().getProperty("height"));
		
		if (this.client == null) {
			this.client = client;
			log(VAR_TABLE_RELOAD);
			init(this, (Element) this.getElement().getFirstChild());
			if (eagerReload){
				requestReload();
			}
			return;
		}
		if (uidl.hasAttribute(VAR_TABLE_META)) {
			log(VAR_TABLE_META);
			reload(uidl.getStringAttribute(VAR_TABLE_META));
		}
		if (uidl.hasAttribute(VAR_LOAD_CELL_LIST_RESPONSE)) {
			log(VAR_LOAD_CELL_LIST_RESPONSE);
			loadTableCellList(this, uidl.getStringAttribute(VAR_LOAD_CELL_LIST_RESPONSE));
		}
		if (uidl.hasAttribute(VAR_LOAD_CELL_DATA_RESPONSE)) {
			log(VAR_LOAD_CELL_DATA_RESPONSE);
			loadCellData(this, uidl.getStringAttribute(VAR_LOAD_CELL_DATA_RESPONSE));
		}
		if (uidl.hasAttribute(VAR_UPDATE_TABLE_CELL_RESPONSE)) {
			log(VAR_UPDATE_TABLE_CELL_RESPONSE);
			updateTableCell(this, uidl.getStringAttribute(VAR_UPDATE_TABLE_CELL_RESPONSE));
		}
		if (uidl.hasAttribute(VAR_LOAD_CELL_MENU_ITEM_LIST_RESPONSE)) {
			log(VAR_LOAD_CELL_MENU_ITEM_LIST_RESPONSE);
			locdCellMenuItemList(this, uidl.getStringAttribute(VAR_LOAD_CELL_MENU_ITEM_LIST_RESPONSE));
		}
	}

	public void reload(String sTableMeta) {
		this.sTableMeta = sTableMeta;
		reloadInternal(this, this.getElement(), sTableMeta);
		if (eagerReload && layerFrameMap.size() == 0){
			LgElementFrame containerFrame = getContainerFrame();
			layerFrameMap.put(this, containerFrame);
		}
		showFrame();
	}

	public void requestReload() {
		this.client.updateVariable(pid, VAR_TABLE_RELOAD, Boolean.TRUE, true);
	}

	public native void init(VLazyGrid vLazyGridThis, Element lazyGridElement)/*-{
		//@com.dmitrynikol.webstorage.gwt.client.JSNI::staticMethod(Ljava/lang/String;)(value);
		
		@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::log(Ljava/lang/String;)('VLazyGrid init');

		
		
		vLazyGridThis.lazyGridPlugin = $wnd.$(lazyGridElement).lazyGrid({
			build: function( lazyGrid, tableCellRange ){
				var sTableCellRange = $wnd.$.toJSON(tableCellRange);
				var sTableCellList = vLazyGridThis.@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::requestLoadTableCellList(Ljava/lang/String;)(sTableCellRange);
			},
			event: function(tableCellEvent){
				var sTableCellEvent = $wnd.$.toJSON(tableCellEvent);
				vLazyGridThis.@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::handleCellEvent(Ljava/lang/String;)(sTableCellEvent);
			},
			onLoadCellData: function(tableCell){
				var sTableCell = $wnd.$.toJSON(tableCell);
				vLazyGridThis.selectedCell = tableCell;
				vLazyGridThis.@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::requestLoadCellData(Ljava/lang/String;)(sTableCell);
			},
			onLoadCellMenu: function(tableCell){
				var sTableCell = $wnd.$.toJSON(tableCell);
				vLazyGridThis.@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::requestLoadMenuItemList(Ljava/lang/String;)(sTableCell);
			},
			onMenuItemSelect: function(menuItemContext){
				var sMenuItemContext = $wnd.$.toJSON(menuItemContext);
				vLazyGridThis.@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::onMenuItemSelect(Ljava/lang/String;)(sMenuItemContext);
			}

		});
		
		vLazyGridThis.lazyGridPlugin.on('tableMove', function(e, eventData)
			{
				if ('nextTable' === eventData.action || 'previousTable' === eventData.action){
					return;
				}
				vLazyGridThis.@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::onTableMove(*)(eventData.action, eventData.offset.top, eventData.offset.left);
			}
		);

		vLazyGridThis.lazyGridPlugin.on('fixedCellsEvent', function(event, data){
			var sData = $wnd.$.toJSON(data);
			vLazyGridThis.@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::onFixedCells(*)(sData);
		});
		
		vLazyGridThis.lazyGridPlugin.on('fillFixedCells', function(event, tableId){
			$wnd.$('div[id$="'+tableId+'-colfixed"]').each(function(){
				vLazyGridThis.lazyGridPlugin.lazyGrid.drawCell(this);
			});
			$wnd.$('div[id$="'+tableId+'-rowfixed"]').each(function(){
				vLazyGridThis.lazyGridPlugin.lazyGrid.drawCell(this);
			});
		});
		
		vLazyGridThis.lazyGridInstance = vLazyGridThis.lazyGridPlugin.lazyGrid;
		
	}-*/;
	
	public void onMenuItemSelect(String sMenuItemContext){
		log(sMenuItemContext);
		if (client == null) {
			return;
		}
		client.updateVariable(client.getPid(this), VAR_MENU_ITEM_SELECT_REQUEST, sMenuItemContext, true);		
	}
	
	public native void reloadInternal(VLazyGrid vLazyGridThis, Element lazyGridElement, String sTableMeta)
	/*-{
			//@com.dmitrynikol.webstorage.gwt.client.JSNI::staticMethod(Ljava/lang/String;)(value);
			
			@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::log(Ljava/lang/String;)('VLazyGrid reload: tableMeta-[' + sTableMeta + ']');
			
			var tableMeta = {};
			tableMeta = $wnd.jQuery.parseJSON(sTableMeta);
			
			
			vLazyGridThis.lazyGridInstance.reloadTable(tableMeta);
	}-*/;

	private void requestLoadTableCellList(String cellRangeList) {
		log("VLazyGrid.requestLoadTableCell: cellRangeList-[" + cellRangeList + "]");
		if (client == null) {
			return;
		}
		client.updateVariable(client.getPid(this), VAR_LOAD_CELL_LIST_REQUEST, cellRangeList, true);
	}
	
	public native void loadTableCellList(VLazyGrid vLazyGridThis, String sTableCellList) 
	/*-{
			@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::log(Ljava/lang/String;)('VLazyGrid loadCellList: tableCellJsonCount-[' + sTableCellList.length + ']');
			
			var tableCellList = {};
			tableCellList = $wnd.jQuery.parseJSON(sTableCellList);
			vLazyGridThis.lazyGridInstance.fillTable(tableCellList);	
	}-*/;

	private void requestLoadMenuItemList(String sTableCell) {
		log("VLazyGrid.loadCellMenu: tableCell-[" + sTableCell + "]");
		if (client == null) {
			return;
		}
		client.updateVariable(client.getPid(this), VAR_LOAD_CELL_MENU_ITEM_LIST_REQUEST, sTableCell, true);
	}
	
	private native void locdCellMenuItemList(VLazyGrid vLazyGridThis, String sMenuItemList)/*-{
		@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::log(Ljava/lang/String;)('VLazyGrid loadCellMenuItemList: menuItemList-[' + sMenuItemList + ']');
		
		var menuItemList = [];
		menuItemList = $wnd.jQuery.parseJSON(sMenuItemList);
		vLazyGridThis.lazyGridInstance.loadCellMenu(menuItemList);	
	}-*/;

	
	private void requestLoadCellData(String sTableCell) {
		log("VLazyGrid.loadCellData: tableCell-[" + sTableCell + "]");
		if (client == null) {
			return;
		}
		client.updateVariable(client.getPid(this), VAR_LOAD_CELL_DATA_REQUEST, sTableCell, true);
	}
	
	private native void loadCellData(VLazyGrid vLazyGridThis, String sCellData)/*-{
		@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::log(Ljava/lang/String;)('VLazyGrid loadCellData: cellData-[' + sCellData + ']');
		
		var cellData = [];
		cellData = $wnd.jQuery.parseJSON(sCellData);
		
		vLazyGridThis.lazyGridInstance.loadCellData(vLazyGridThis.selectedCell, cellData);	
	}-*/;
	
	private native void updateTableCell(VLazyGrid vLazyGridThis, String sTableCellList)/*-{
		@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::log(Ljava/lang/String;)('VLazyGrid updateTableCellList: tableCellList-[' + sTableCellList + ']');
		
		var cellData = [];
		tableCellList = $wnd.jQuery.parseJSON(sTableCellList);
		
		vLazyGridThis.lazyGridInstance.updateTableCellList(tableCellList);	
	}-*/;

	public void handleCellEvent(String sTableCellEvent) {
		if (client == null) {
			return;
		}
		client.updateVariable(pid, VAR_TABLE_CELL_EVENT, sTableCellEvent, true);
	}

	public static native void log(String message)
	/*-{
			if (typeof console === "undefined" || typeof console.log === "undefined" || $wnd.window.location.href.indexOf('?debug') === -1) {
			return;
			}
			console.log('VLazyGrid: ' + message);
	}-*/;

	public native void showCells(VLazyGrid vLazyGridThis, Element lazyGridElement, int vWidth, int vHeight, int offsetLeft, int offsetTop, float zoom)/*-{
		@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::log(Ljava/lang/String;)('VLazyGrid showCells');
		
		vLazyGridThis.lazyGridPlugin.lazyGrid.setZoom(zoom);
		
		vLazyGridThis.lazyGridPlugin.showCells(
			{
       			offsetTop: offsetTop,
       			offsetLeft: offsetLeft,
       			tableWidth: vWidth,
       			tableHeight: vHeight
      		}		
		);
		
	}-*/;	
	
	public void hideFrame(){
		if (!frameVisible){
			return;
		}
		this.frameVisible = false;
		hideCellsInternal(this, this.getElement());
	}
	
	public native void hideCellsInternal(VLazyGrid vLazyGridThis, Element lazyGridElement)/*-{
		@com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid::log(Ljava/lang/String;)('VLazyGrid hideCells');
		vLazyGridThis.lazyGridPlugin.hideCells();
	}-*/;		
	
	public void onFixedCells(String sEventData){
		log("onFixedCells: data-[" + sEventData + "];");
		if (listener != null){
			listener.onFixedCells(this, sEventData);
		} else {
			LgElementFrame tableElementFrame = getElementFrame();
			LgElementFrame containerFrame = getContainerFrame();

			drawFixedCells(this, fixedCellsElement, 0, 0, sEventData);
		}
	}

	private native String drawFixedCells(LazyGridClient lazyGrid, Element fixedCellElement, int tableLeft, int tableTop, String sEventData)/*-{
		var eventData = {};
		eventData = $wnd.jQuery.parseJSON(sEventData);
		eventData.tableOffsetLeft = tableLeft;
 		eventData.tableOffsetTop = tableTop;
 		
 		var fixedCellPlugin = $wnd.$(fixedCellElement);
 		var fixedCellsResult = fixedCellPlugin.fixedCells(eventData);
 		fixedCellPlugin.on('clickFixedCell', function(e, cellElement)
		{
			lazyGrid.lazyGridPlugin.lazyGrid.clickFixedCell(cellElement);
			
		});
		
		lazyGrid.lazyGridPlugin.lazyGrid.addServerCellRange(fixedCellsResult.cellRanges);
		lazyGrid.lazyGridPlugin.lazyGrid.setFixedOverlap(fixedCellsResult.overlapTop, fixedCellsResult.overlapLeft);
		
		return  $wnd.$.toJSON(fixedCellsResult.cellRanges);
	}-*/;

	
	
	public void onTableMove(String action, int top, int left){
		log("onTebleMove: action-[" + action + "]; top-[" + top + "]; left-[" + left + "]");
		content.setScrollLeft(content.getScrollLeft() + left);
		content.setScrollTop(content.getScrollTop() + top);
		
		if (listener != null){
			listener.onTableMove(this, action, top, left);
		}
	}

	
	
	@Override
	public void showFrame(Object frameId, LgElementFrame frame, int delay) {
		scrollTimer.cancel();
		if (delay > 0){
			scrollTimer.frameId = frameId;
			scrollTimer.frame = frame;
			scrollTimer.schedule(delay);
		} else {
			showFrameInternal(frameId, frame);
		}
	}

	public void showFrameInternal(Object frameId, LgElementFrame intersection){
		layerFrameMap.put(frameId, intersection);

		if (intersection == null){
			hideFrame();
			return;
		}
		
		Collection<LgElementFrame> layerFrameCollection = new ArrayList<LgElementFrame>(layerFrameMap.values());
		intersection = calculateVisibleFrame(layerFrameCollection);
		
		if (intersection == null){
			hideFrame();
			return;
		}

		if (sTableMeta == null){
			requestReload();
			return;
		}
		
		frameVisible = true;
		
		//Window.alert(String.valueOf(intersection.getLeft()));
		
		showCells(this, this.getElement(), intersection.getWidth(), intersection.getHeight(), intersection.getLeft(), intersection.getTop(), getZoom());
	}

	private LgElementFrame calculateVisibleFrame(Collection<LgElementFrame> frameCollection) {
		LgElementFrame result = frameCollection.iterator().next();
		if (result == null){
			return null;
		}
		frameCollection.remove(result);
		for (LgElementFrame layerFrame : frameCollection) {
			if (layerFrame == null){
				return null;
			}
			
			result = calculateMinimumFrame(result, layerFrame);
		}
		return result;
	}

	private LgElementFrame calculateMinimumFrame(LgElementFrame a, LgElementFrame b){
		LgElementFrame result = new LgElementFrame();		
		result.setLeft(a.getLeft() + b.getLeft());
		result.setTop(a.getTop() + b.getTop());
		result.setWidth(a.getWidth() >= b.getWidth() ? b.getWidth() : a.getWidth());
		result.setHeight(a.getHeight() >= b.getHeight() ? b.getHeight() : a.getHeight());
		
		return result;
	}
	
	private void showFrame() {
		Object frameId = layerFrameMap.keySet().iterator().next();
		LgElementFrame frame = layerFrameMap.get(frameId);
		showFrameInternal(frameId, frame);
	}
	
	private LgElementFrame getContainerFrame() {
		int scrollLeft = content.getScrollLeft();
		int scrollTop = content.getScrollTop();
		
		LgElementFrame containerFrame = new LgElementFrame();
		containerFrame.setLeft(scrollLeft);
		containerFrame.setTop(scrollTop);
		containerFrame.setWidth(content.getOffsetWidth());
		containerFrame.setHeight(content.getOffsetHeight());
		return containerFrame;
	}

	private LgElementFrame getElementFrame() {
		Element element = (Element)content.getFirstChild();
		if (element == null){
			return getContainerFrame();
		}
		LgElementFrame elementFrame = new LgElementFrame();
		elementFrame.setLeft(0);
		elementFrame.setTop(0);
		elementFrame.setWidth(element.getOffsetWidth());
		elementFrame.setHeight(element.getOffsetHeight());
		return elementFrame;
	}
	
}