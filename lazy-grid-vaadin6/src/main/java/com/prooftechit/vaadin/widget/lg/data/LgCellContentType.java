package com.prooftechit.vaadin.widget.lg.data;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;

public abstract class LgCellContentType {

	protected String editPluginName;
	protected Map<String, String> typeParameters = new HashMap<String, String>();

	public LgCellContentType(String editPluginName) {
		super();
		this.editPluginName = editPluginName;
	}

	@JsonIgnore
	public abstract Object getDefaultValue();

	public String formatValue(Object value){
		return value == null ? "" : value.toString();
	};

	@JsonGetter
	public String getTypeName() {
		return this.getClass().getName();
	}
	
	@JsonGetter
	public String getEditPluginName() {
		return editPluginName;
	}

	public void setEditPluginName(String editPluginName) {
		this.editPluginName = editPluginName;
	}

	public void setTypeParameters(Map<String, String> typeParameters) {
		this.typeParameters = typeParameters;
	}

	public Map<String, String> getTypeParameters() {
		return Collections.unmodifiableMap(typeParameters);
	}

	public void setTypeParameter(String name, String value) {
		typeParameters.put(name, value);
	}

	public String getTypeParameter(String name) {
		return typeParameters.get(name);
	}

	public static class LgCellContentLabel extends LgCellContentType {

		public static final String LG_CELL_CONTENT_LABEL = "LG_CELL_CONTENT_LABEL";

		public LgCellContentLabel() {
			super(LG_CELL_CONTENT_LABEL);
		}

		@Override
		@JsonIgnore
		public String getDefaultValue() {
			return "";
		}

	}

	public static class LgCellContentText extends LgCellContentType {

		public static final String LG_CELL_CONTENT_TEXT = "LG_CELL_CONTENT_TEXT";
		public static final String TYPE_PARAMETER_INPUT_MASK = "inputMask";
		
		public LgCellContentText() {
			super(LG_CELL_CONTENT_TEXT);
		}

		@Override
		@JsonIgnore
		public String getDefaultValue() {
			return "";
		}

	}

	public static class LgCellContentNumber extends LgCellContentType {

		public static final String LG_CELL_CONTENT_NUMBER = "LG_CELL_CONTENT_NUMBER";
		public static final String TYPE_PARAMETER_INPUT_MASK = "inputMask";
		public static final String TYPE_PARAMETER_FORMAT = "format";
		public static final String TYPE_PARAMETER_GROUP_SEPARATOR = "groupSeparator";
		public static final String TYPE_PARAMETER_DECIMAL_SEPARATOR = "decimalSeparator";

		public LgCellContentNumber() {
			super(LG_CELL_CONTENT_NUMBER);
			this.typeParameters.put(TYPE_PARAMETER_INPUT_MASK, "######.##");
			this.typeParameters.put(TYPE_PARAMETER_FORMAT, ".00");
			this.typeParameters.put(TYPE_PARAMETER_GROUP_SEPARATOR, " ");
			this.typeParameters.put(TYPE_PARAMETER_DECIMAL_SEPARATOR, ".");
		}

		@Override
		@JsonIgnore
		public Double getDefaultValue() {
			return 0d;
		}

		@Override
		public String formatValue(Object value) {
			if (value == null){
				return "";
			}
			DecimalFormatSymbols formatSymbols = new DecimalFormatSymbols();
			formatSymbols.setGroupingSeparator(typeParameters.get(TYPE_PARAMETER_GROUP_SEPARATOR).charAt(0));
			formatSymbols.setDecimalSeparator(typeParameters.get(TYPE_PARAMETER_DECIMAL_SEPARATOR).charAt(0));
			
			DecimalFormat format = new DecimalFormat(typeParameters.get(TYPE_PARAMETER_FORMAT), formatSymbols);
			format.setGroupingSize(3);
			format.setGroupingUsed(true);
			return format.format((Number)value);
		}

		
	}

	public static class LgCellContentDate extends LgCellContentType {

		public static final String LG_CELL_CONTENT_DATE = "LG_CELL_CONTENT_DATE";
		public static final String TYPE_PARAMETER_FORMAT = "format";
		
		public LgCellContentDate() {
			super(LG_CELL_CONTENT_DATE);
			this.typeParameters.put(TYPE_PARAMETER_FORMAT, "yyyy.MM.dd HH:mm:ss ");
		}

		@Override
		@JsonIgnore
		public Long getDefaultValue() {
			return System.currentTimeMillis();
		}

		@Override
		public String formatValue(Object value) {
			SimpleDateFormat sdf = new SimpleDateFormat(this.typeParameters.get(TYPE_PARAMETER_FORMAT));
			return sdf.format(new Date((Long) value));
		}
		
		

	}

	/**
	 * Тип "список". Определяет список элементов доступных для выбора в качестве значения ячейки.
	 * Значением для ячейки с типом "список" является значение ключевого поля элемента списка.
	 * 
	 * Параметры типа: <br>
	 * - режим отображения списка (selectMode = dropdown либо popup) <br>
	 * - доступность редактирования значения (editable = true либо false) <br>  
	 * - список доступных для выбора элементов без загрузки с сервера (itemList = [{itemValue1: "v1"}, {itemValue2: "v2", ...}]) <br>
	 * - ключевое поле (keyField = keyFieldName) <br>
	 * - заголовок поля (keyFieldName.header = localizedFieldHeaderName) <br>
	 * - локализация кнопки выбора (ok.label = Сохранить) <br>
	 * - локализация кнопки отмены (cancel.label = Отмена) <br>
	 * 
	 * @author sbespalov
	 *
	 */
	public static class LgCellContentList extends LgCellContentType {

		public static final String LG_CELL_CONTENT_LIST = "LG_CELL_CONTENT_LIST";
		
		public static final String TYPE_PARAMETER_SELECT_MODE = "selectMode";
		public static final String TYPE_PARAMETER_ITEM_LIST = "itemList";
		public static final String TYPE_PARAMETER_VALUE_SELECT_MODE_DROPDOWN = "dropdown";
		public static final String TYPE_PARAMETER_VALUE_SELECT_MODE_POPUP = "popup";
		public static final String TYPE_PARAMETER_EDITABLE = "editable";
		public static final String TYPE_PARAMETER_KEY_FIELD = "keyField";
		public static final String TYPE_PARAMETER_OK_LABEL = "ok.label";
		public static final String TYPE_PARAMETER_CANCEL_LABEL = "cancel.label";

		public LgCellContentList() {
			super(LG_CELL_CONTENT_LIST);
			this.typeParameters.put(TYPE_PARAMETER_KEY_FIELD, "itemValue");
		}

		@Override
		@JsonIgnore
		public String getDefaultValue() {
			return "";
		}

	}


}