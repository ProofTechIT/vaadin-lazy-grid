package com.prooftechit.vaadin.widget.lg;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vaadin.terminal.PaintException;
import com.vaadin.terminal.PaintTarget;
import com.vaadin.ui.AbstractComponent;
import com.vaadin.ui.ClientWidget;
import com.vaadin.ui.ClientWidget.LoadStyle;

import com.prooftechit.vaadin.widget.lg.client.ui.VLazyGrid;
import com.prooftechit.vaadin.widget.lg.data.LgCellContentType;
import com.prooftechit.vaadin.widget.lg.data.LgMenuItem;
import com.prooftechit.vaadin.widget.lg.data.LgMenuItemContext;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;
import com.prooftechit.vaadin.widget.lg.data.LgTableCellRange;
import com.prooftechit.vaadin.widget.lg.data.LgTableMeta;

@ClientWidget(value = VLazyGrid.class, loadStyle = LoadStyle.EAGER)
public class LazyGrid extends AbstractComponent {

	private static final long serialVersionUID = 1L;

	private static final Logger LOGGER = Logger.getLogger(LazyGrid.class.getName());

	private LgTableMeta tableMeta;
	private TableCellProvider cellProvider;
	private TableCellEventListener cellEventListener;
	private TableCellDataProvider cellDataProvider;
	private TableCellContextMenuProvider cellContextMenuProvider;
	private TableCellContextMenuListener cellContextMenuListener;
	// private Gson gson;
	private ObjectMapper objectMapper;

	private transient List<LgTableCell> loadCellListResponse;
	private transient Boolean reload;
	private transient List<Map<String, String>> cellDataResponse;
	private transient List<LgTableCell> updateTableCellResponse;
	private transient List<LgMenuItem> cellMenuItemListResponse;

	public LazyGrid(TableCellProvider provider) {
		super();

		this.tableMeta = new LgTableMeta();
		this.cellProvider = provider;

		// gson = new GsonBuilder()
		// .registerTypeAdapter(LgCellContentType.class, new
		// JsonDeserializer<LgCellContentType>() {
		//
		// @Override
		// public LgCellContentType deserialize(JsonElement json, Type typeOfT,
		// JsonDeserializationContext context) throws JsonParseException {
		// JsonObject jsonObj = json.getAsJsonObject();
		// JsonElement contentTypeName = jsonObj.get("typeName");
		// if (contentTypeName == null){
		// throw new JsonParseException("Content type name not found.");
		// }
		// Class<? extends LgCellContentType> contentTypeClass =
		// LgCellContentType.getContentTypeNameMap().get(contentTypeName.getAsString());
		// if (contentTypeClass == null){
		// throw new JsonParseException("Content type class not found.");
		// }
		// return context.deserialize(json, contentTypeClass);
		// }
		//
		// }).create();
		StdDeserializer<LgCellContentType> deserializer = new StdDeserializer<LgCellContentType>(
				LgCellContentType.class) {

			@Override
			public LgCellContentType deserialize(JsonParser jp, DeserializationContext ctxt)
					throws IOException, JsonProcessingException {
				ObjectMapper mapper = (ObjectMapper) jp.getCodec();
				ObjectNode root = (ObjectNode) mapper.readTree(jp);
				JsonNode contentTypeName = root.get("typeName");

				if (contentTypeName == null) {
					throw new JsonParseException(jp, "Content type name not found.");
				}
				Class<?> contentTypeClass;
				try {
					contentTypeClass = Class.forName(contentTypeName.asText());
				} catch (ClassNotFoundException e) {
					throw new JsonParseException(jp, "Content type class not found.");
				}
				if (contentTypeClass == null) {
					throw new JsonParseException(jp, "Content type class not found.");
				}
				return (LgCellContentType) mapper.treeToValue(root, contentTypeClass);
			}

		};

		SimpleModule module = new SimpleModule();
		module.addDeserializer(LgCellContentType.class, deserializer);

		objectMapper = new ObjectMapper();
		objectMapper.registerModule(module);
//		objectMapper.setVisibility(objectMapper.getSerializationConfig().getDefaultVisibilityChecker()
//				.withFieldVisibility(JsonAutoDetect.Visibility.NONE)
//				.withGetterVisibility(JsonAutoDetect.Visibility.PUBLIC_ONLY)
//				.withSetterVisibility(JsonAutoDetect.Visibility.PUBLIC_ONLY)
//				.withCreatorVisibility(JsonAutoDetect.Visibility.PUBLIC_ONLY));
		objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

	}

	public LgTableMeta getTableMeta() {
		return tableMeta;
	}

	public void setTableMeta(LgTableMeta tableMeta) {
		this.tableMeta = tableMeta;
		reload = Boolean.TRUE;
		requestRepaint();
	}

	public void reload() {
		reload = Boolean.TRUE;
		requestRepaint();
	}

	public TableCellEventListener getCellEventListener() {
		return cellEventListener;
	}

	public void setCellEventListener(TableCellEventListener cellEventListener) {
		this.cellEventListener = cellEventListener;
	}

	public TableCellContextMenuListener getCellContextMenuListener() {
		return cellContextMenuListener;
	}

	public void setCellContextMenuListener(TableCellContextMenuListener cellContextMenuListener) {
		this.cellContextMenuListener = cellContextMenuListener;
	}

	public TableCellDataProvider getCellDataProvider() {
		return cellDataProvider;
	}

	public void setCellDataProvider(TableCellDataProvider cellDataProvider) {
		this.cellDataProvider = cellDataProvider;
	}

	public void updateTableCellList(List<LgTableCell> tableCellList) {
		updateTableCellResponse = tableCellList;
		requestRepaint();
	}

	public TableCellContextMenuProvider getCellContextMenuProvider() {
		return cellContextMenuProvider;
	}

	public void setCellContextMenuProvider(TableCellContextMenuProvider cellContextMenuProvider) {
		this.cellContextMenuProvider = cellContextMenuProvider;
	}

	@Override
	public void paintContent(PaintTarget target) throws PaintException {
		super.paintContent(target);
		try {
			if (Boolean.TRUE.equals(reload)) {
				target.addAttribute(VLazyGrid.VAR_TABLE_META, objectMapper.writeValueAsString(tableMeta));
				reload = null;
				return;
			}
			if (loadCellListResponse != null) {
				target.addAttribute(VLazyGrid.VAR_LOAD_CELL_LIST_RESPONSE,
						objectMapper.writeValueAsString(loadCellListResponse));
				loadCellListResponse = null;
			}
			if (cellDataResponse != null) {
				target.addAttribute(VLazyGrid.VAR_LOAD_CELL_DATA_RESPONSE,
						objectMapper.writeValueAsString(cellDataResponse));
				cellDataResponse = null;
			}
			if (updateTableCellResponse != null) {
				target.addAttribute(VLazyGrid.VAR_UPDATE_TABLE_CELL_RESPONSE,
						objectMapper.writeValueAsString(updateTableCellResponse));
				updateTableCellResponse = null;
			}
			if (cellMenuItemListResponse != null) {
				target.addAttribute(VLazyGrid.VAR_LOAD_CELL_MENU_ITEM_LIST_RESPONSE,
						objectMapper.writeValueAsString(cellMenuItemListResponse));
				cellMenuItemListResponse = null;
			}
		} catch (JsonProcessingException e) {
			throw new PaintException(e);
		}
	}

	@Override
	public void changeVariables(Object source, Map<String, Object> variables) {
		super.changeVariables(source, variables);
		if (variables.containsKey(VLazyGrid.VAR_TABLE_RELOAD)) {
			LOGGER.log(Level.FINE, String.format("LazyGrid reload"));
			reload = Boolean.TRUE;
			requestRepaint();
		}
		try {
			if (variables.containsKey(VLazyGrid.VAR_LOAD_CELL_LIST_REQUEST)) {
				String sCellRangeList = (String) variables.get(VLazyGrid.VAR_LOAD_CELL_LIST_REQUEST);
				LOGGER.log(Level.FINE, String.format("LazyGrid load cell list: cellRangeList-[%s];",
						VLazyGrid.VAR_LOAD_CELL_LIST_REQUEST, sCellRangeList));
				List<LgTableCellRange> cellRangeList = Arrays
						.asList(objectMapper.readValue(sCellRangeList, LgTableCellRange[].class));
				loadCellListResponse = cellProvider.loadTableCellRange(cellRangeList);
				requestRepaint();
			}
			if (cellEventListener != null && variables.containsKey(VLazyGrid.VAR_TABLE_CELL_EVENT)) {
				String sTableCellEvent = (String) variables.get(VLazyGrid.VAR_TABLE_CELL_EVENT);
				LOGGER.log(Level.FINE, String.format("LazyGrid cell event: value-[%s];", sTableCellEvent));
				TableCellEvent tableCellEvent = objectMapper.readValue(sTableCellEvent, TableCellEvent.class);
				updateTableCellResponse = cellEventListener.handleEvent(tableCellEvent);
				requestRepaint();
			}
			if (cellDataProvider != null && variables.containsKey(VLazyGrid.VAR_LOAD_CELL_DATA_REQUEST)) {
				String sTableCell = (String) variables.get(VLazyGrid.VAR_LOAD_CELL_DATA_REQUEST);
				LOGGER.log(Level.FINE, String.format("LazyGrid load cell data: cell-[%s]", sTableCell));
				LgTableCell tableCell = objectMapper.readValue(sTableCell, LgTableCell.class);
				cellDataResponse = cellDataProvider.loadCellData(tableCell);
				requestRepaint();
			}
			if (cellContextMenuProvider != null
					&& variables.containsKey(VLazyGrid.VAR_LOAD_CELL_MENU_ITEM_LIST_REQUEST)) {
				String sTableCell = (String) variables.get(VLazyGrid.VAR_LOAD_CELL_MENU_ITEM_LIST_REQUEST);
				LOGGER.log(Level.FINE, String.format("LazyGrid load cell menu: cell-[%s]", sTableCell));
				LgTableCell tableCell = objectMapper.readValue(sTableCell, LgTableCell.class);
				cellMenuItemListResponse = cellContextMenuProvider.loadMenuItemList(tableCell);
				requestRepaint();
			}
			if (cellContextMenuListener != null && variables.containsKey(VLazyGrid.VAR_MENU_ITEM_SELECT_REQUEST)) {
				String sMenuItemContext = (String) variables.get(VLazyGrid.VAR_MENU_ITEM_SELECT_REQUEST);
				LOGGER.log(Level.FINE, String.format("LazyGrid menu item select: value-[%s];", sMenuItemContext));
				LgMenuItemContext menuItemContext = objectMapper.readValue(sMenuItemContext, LgMenuItemContext.class);
				cellContextMenuListener.onMenuItemClick(menuItemContext);
				requestRepaint();
			}
		} catch (IOException e) {
			LOGGER.log(Level.SEVERE, "Failed to update component variables.", e);
			new RuntimeException(e);
		}
	}

}
