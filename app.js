(function($) {
	var lgContextMenu;

	function createContextMenu(){
		var menuElement = $('<ul class="context-menu"></ul>');
		$('html').append(menuElement);

        var menu = $(menuElement).menu();

        menu.element = menuElement;
        lgContextMenu = menu;
	}

	function initLgContextMenu(){
		var htmlElement = $('html');

        $(htmlElement).on("contextmenu", function (event) {
        	var x = event.clientX, y = event.clientY;

			var elementMouseIsOver = getLgCellElement($(document.elementFromPoint(x, y)));
			if (!elementMouseIsOver.hasClass("cell") && !elementMouseIsOver.hasClass("cell-inner")){
				return true;
			}
			
			var cellElement = elementMouseIsOver;
			var lazyGridElement = cellElement.parents(".lazy-grid");
			var lazyGridThis = lazyGridElement[0].lgInstance.lazyGrid;
			var menu = lgContextMenu;
			var menuElement = menu.element;
			
			var cell = lazyGridThis.data[cellElement.data('row')][cellElement.data('col')];
			
			if (!cell.contextMenuEnable){
				return true;
			}
			
			menu.css({
			    "top": (y + 10) + "px",
			    "left": (x + 10) + "px",
			    "display": "none",
			});
			
			menuElement.each(function(){
				this.tableCell = cell;
				this.tableCellElement = cellElement;
			});
			
			lazyGridThis.initialData.onLoadCellMenu(cell);
            return false;
        });

        $(document).click(function (e) {
        	$.each($(".lazy-grid"), function(key, lazyGridElement){
    			var lazyGridThis = lazyGridElement.lgInstance.lazyGrid;
    			var menu = lgContextMenu;
    			if (menu.element.has(e.target).length === 0)
    			{
    				menu.hide();
    			}
        	});
   		});
	}
	
	function log(message){
		if (
			typeof console === "undefined" || 
			typeof console.log === "undefined"
		){
			return;
		}
		console.log('VLazyGrid: ', message);
	}
	
	if (!('indexOf' in Array.prototype)) {
		Array.prototype.indexOf= function(find, i /*opt*/) {
			if (i===undefined) i= 0;
			if (i<0) i+= this.length;
			if (i<0) i= 0;
			for (var n= this.length; i<n; i++)
				if (i in this && this[i]===find)
					return i;
			return -1;
		};
	}
	
	function LazyGrid(){
		var that = this;
		
		this.element = {};
		this.tableWrapper = {};
		this.data = [];
		this.tableServerCellRange = [];
		
		this.tableStartColumn = 0;
		this.tableStartRow = 0;
		this.cellTop = 0;
		this.cellBottom = 0;
		this.cellLeft = 0;
		this.cellRight = 0;
		this.cellOffset = 1;
		this.realColumns = [];
		this.realRows = [];
		this.tableIdSalt = Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
		this.isDrawing = true;
		this.needRebuild = true;
		this.selectArea = {};
		this.selectedCells = [];
		this.selectedCellsHelper = {};
		this.fixedColumns = {};
		this.fixedRows = {};
		this.displayedFixedColumns = [];
		this.displayedFixedRows = [];
		this.fixedColumnsRange = [];
		this.fixedRowsRange = [];
		this.additionalFixedColumns = [];
		this.additionalFixedRows = [];
		
		this.tablePositionY = 0;
		this.tablePositionX = 0;
		
		this.realTableHeight = 0;
		this.realTableWidth = 0;
		this.scrollBarWidth = 0;
		
		this.focusCurrentCell = false;
		this.stopTab = false;
		this.tabDirection = 'forward';

		this.useActiveCell = false;

		this.canMoveNextEdit = true;
		this.isTabPressed = false;
		
		this.cellsUnions = {};
		
		this.currentActiveCell = {
			row: -1,
			col: -1
		};

		this.defaultCellSize = {
			width: 60,
			height: 25
		};
		this.dataForDisplay = [];

		this.timer = {};
		this.timerServerOnSelect = {};
		this.mousedown = false;
		this.tooltipPosition = '';
		
		this.ctrlPressed = false;
		this.shiftPressed = false;
		//var areaIndex = that.selectArea.cellPosition.length === 0? 0 : that.selectArea.cellPosition.length -1;
		this.leftMouse = 0;
		this.rightMouse = 2;
		
		this.time1;
		this.time2;
		
		// Simple table generate.
		this.init = function(){
			$.each(that.meta.columnList, function(key, item){
				that.realColumns[item.index] = item;
				if( item.fixed ){
					that.fixedColumns[item.index] = item; 
				}
			});
			$.each(that.meta.rowList, function(key, item){
				that.realRows[item.index] = item;
				if( item.fixed ){
					that.fixedRows[item.index] = item; 
				}
			});
			$.each(that.meta.rowList, function(key, item){
				that.realRows[item.index] = item; 
			});
			$('<div/>',{
				'id': 'lazyTable-'+that.tableIdSalt+'-wrapper',
				'class': 'lazyTable-wrapper'
			}).appendTo(that.element);
			that.tableWrapper = $('#'+'lazyTable-'+that.tableIdSalt+'-wrapper');
			that.determinateRealTableSize();
			that.determinateDisplayedCellsAndRows();
			that.determinateMergedUnions();
		};
		
		this.createCellContent = function(cell){
			if( typeof(cell) === 'undefined' ){
				return;
			}
			var cellId = getLgCellId(cell,that);
			if( !$(cellId).length ){
				if( !$(cellId+'-rowfixed').length ){
					if( !$(cellId+'-colfixed').length ){
						return;
					} else {
						cellId +='-colfixed';
					}
				} else {
					cellId +='-rowfixed';
				}
			}
			
			if( !$(cellId).find('.cell-inner').length ){
				return;
			}
			
			if( $(cellId).find('.cell-filled').length ){
				return;
			}
			
			if( $(cellId).find('.cell-disabled').length ){
				return;
			}
			
			var cellElement = $(cellId).find('.cell-inner')[0];//document.getElementById(cellId);
			var cellList = [];
			
			cell.contentValue = typeof(cell.contentValue) === 'undefined'? '' : cell.contentValue;
			
			$(cellElement).html(cell.contentValue);
			
//			if( typeof(cellElement.innerText) !== 'undefined' ){
//				cellElement.innerText = cell.contentValue;
//			} else if( typeof(cellElement.textContent) !== 'undefined' ){
//				cellElement.textContent = cell.contentValue;
//			}
			
			cellElement.className += ' '+ (typeof(cell.styleNameSet) !== 'undefined'? cell.styleNameSet : '');
			cellElement.className += ' '+ (typeof(that.realColumns[cell.colIndex]) !== 'undefined'? that.realColumns[cell.colIndex].styleNameSet : that.meta.defaultColumn.styleNameSet);
			cellElement.className += ' '+ (typeof(that.realRows[cell.rowIndex]) !== 'undefined'? that.realRows[cell.rowIndex].styleNameSet : that.meta.defaultRow.styleNameSet);
			cellElement.className += ' cell-filled';
			
			var cellElemenStyle = ' '+ (typeof(cell.style) !== 'undefined'? cell.style : '');
			$(cellElement).attr("style", $(cellElement).attr("style") + "; " + cellElemenStyle);
			/////
			that.data[cell.rowIndex] = typeof(that.data[cell.rowIndex]) === 'undefined'? [] : that.data[cell.rowIndex];
			that.data[cell.rowIndex][cell.colIndex] = cell;
			
		};
		
		this.startCellEdit = function(cellElement, e, preventDefault){
			var previousActiveCell = {
				row: that.currentActiveCell.row,
				col: that.currentActiveCell.col
			};
			//that.moveTableRealtiveToElement(cellElement, previousActiveCell);
			
			var rowIndex = cellElement.data('row');
			var colIndex = cellElement.data('col');
			var cell = that.data[rowIndex][colIndex];
			if( !isLgCellEditable(cell)){
				return;
			}
			
			if( preventDefault ){
				e = e || window.event;
				e.preventDefault ? e.preventDefault() : (e.returnValue = false);	
			}
			
			var cellCopy = jQuery.extend({}, cell);
			that.serverEvent('onEdit', [cellCopy]);
			
			cellElement.parents('.cell').css({
				'z-index' : 2
			});
			cellElement.css('overflow', 'visible');
			
			that.currentActiveCell.row = rowIndex;
			that.currentActiveCell.col = colIndex;
			that.deleteStaticSelectedCells();
			that.edit(cell);
			//that.canMoveNextEdit = true;
		};
		
		this.moveTableToLeftBegin = function(elementHeight){
			var tableTop = Math.abs($('#lazyTable-'+that.tableIdSalt).position().top);
			delete that.previousTableRange;
			that.tableWrapper.scrollLeft(0);
			that.tableWrapper.scrollTop(tableTop - elementHeight);
			
			
			//that.focusCurrentCell = true;
		};

		this.moveTableToRightEnd = function(elementHeight){
			var tableTop = Math.abs($('#lazyTable-'+that.tableIdSalt).position().top);
			var tableRight = Math.abs($('#lazyTable-'+that.tableIdSalt).outerWidth(true));
			delete that.previousTableRange;
			that.tableWrapper.scrollLeft(tableRight - $(that.tableWrapper).width());
			that.tableWrapper.scrollTop(tableTop - elementHeight);
			
			
			//that.focusCurrentCell = true;
		};

		
		this.moveTableRealtiveToElement = function(cellElement, previousActiveCell){
			cellElement = cellElement.parent();
			var cellWidth = typeof(that.realColumns[previousActiveCell.col]) !== 'undefined'? 
				that.realColumns[previousActiveCell.col].width : that.meta.defaultColumn.width;
			var cellHeight = typeof(that.realRows[previousActiveCell.row]) !== 'undefined'? 
				that.realRows[previousActiveCell.row].height : that.meta.defaultRow.height;
			var cellTopBorder = cellElement.position().top;
			var cellLeftBorder = cellElement.position().left;
			var cellBottomBorder = cellElement.position().top+cellHeight;
			var cellRightBorder = cellElement.position().left+cellWidth;
			
			var tableTopBorder = Math.abs($('#lazyTable-'+that.tableIdSalt).position().top);
			var tableLeftBorder = Math.abs($('#lazyTable-'+that.tableIdSalt).position().left);
			var tableBottomBorder = Math.abs($('#lazyTable-'+that.tableIdSalt).position().top)+that.tableWrapper.height();
			var tableRightBorder = Math.abs($('#lazyTable-'+that.tableIdSalt).position().left)+that.tableWrapper.width();
			
			if( cellRightBorder + 50 > tableRightBorder ){
				that.tableWrapper.scrollLeft(cellRightBorder - that.tableWrapper.width() + 50 );
			}
			else if( cellLeftBorder - 50 < tableLeftBorder ){
				that.tableWrapper.scrollLeft(cellLeftBorder - 50);
			}
			if( cellBottomBorder + 50 > tableBottomBorder ){
				that.tableWrapper.scrollTop(cellBottomBorder - that.tableWrapper.height() + 50 );
			}
			else if( cellTopBorder - 50 < tableTopBorder ){
				that.tableWrapper.scrollTop(cellTopBorder - 50);
			}
		};
		
		this.moveTableLeftForOneColumn = function(colIndex){
			var cellWidth = typeof(that.realColumns[colIndex]) !== 'undefined'? 
				that.realColumns[colIndex].width : that.meta.defaultColumn.width;
			var tableLeftBorder = Math.abs($('#lazyTable-'+that.tableIdSalt).position().left);
			
			that.tableWrapper.scrollLeft(tableLeftBorder-cellWidth-50);
		};
		
		this.getCellValue = function(cell){
			return typeof(cell.value) === 'undefined'? '' : cell.value.value;
		};

		this.setCellValue = function(cell, value){
			if (typeof(cell.value) === 'undefined'){
				return;
			}
			cell.value.value = value;
		};
		
		this.edit = function(cell){
			var element;
			var cellId = getLgCellId(cell, that);
			if( !$(cellId).length ){
				if( !$(cellId+'-colfixed').length ){
					if( !$(cellId+'-rowfixed').length ){
						return;
					} else {
						cellId +='-rowfixed';
					}
				} else {
					cellId +='-colfixed';
				}
			}
			cellId += ' .cell-inner'; 
			var cellInnerElement = $(cellId);
			cellInnerElement.parent().addClass('cell-under-edit');
			var contentTypeName = cell.contentType.editPluginName;
			switch(contentTypeName){
				case 'LG_CELL_CONTENT_LABEL':
					break;
				case 'LG_CELL_CONTENT_NUMBER':
					cellInnerElement.html( '<input class="cell-edit number-cell" value="' + that.getCellValue(cell) + '" />' );
					cellInnerElement.addClass('cell-under-edit');
					element = cellInnerElement.find('.number-cell');
					var digits = '###.##'.split('.');
					if (cell.contentType.typeParameters.inputMask){
						digits = cell.contentType.typeParameters.inputMask.split('.');
					}
					element.inputmask({
						'alias': 'numeric', 
						'autoGroup': true, 
						'integerDigits': digits[0].length, 
						'digits': (digits[1]||[]).length,
						'digitsOptional': false, 
						'placeholder': '0'
					});
					element.focus().select();
					that.cellSave(element, cellId, cell);
					that.canMoveNextEdit = true;
					break;
				case 'LG_CELL_CONTENT_DATE':
					cellInnerElement.html( '<input readonly="readonly" class="cell-edit date-cell" value="' + cell.contentValue + '"/>' );
					cellInnerElement.addClass('cell-under-edit');
					element = cellInnerElement.find('.date-cell');
					that.createCellDatepicker(cellId, cell, element);
					break;
				case 'LG_CELL_CONTENT_LIST':
					if ("popup" === cell.contentType.typeParameters.selectMode){
						cellInnerElement.html( '<div class="cell-edit list-cell"></div>' );
					} else {
						cellInnerElement.html( '<input type="text" class="cell-edit list-cell"></div>' );
					}
					cellInnerElement.addClass('cell-under-edit');
					element = cellInnerElement.find('.list-cell');
					
					if (!cell.contentType.typeParameters.itemList){
						that.initialData.onLoadCellData(cell);
						break;
					}
						
					var itemList = [];
					var sItemList = cell.contentType.typeParameters.itemList;
					itemList = jQuery.parseJSON(sItemList);
					that.createCellContentList(cellId, cell, element, itemList);
					break;
				case 'LG_CELL_CONTENT_TEXT':
					cellInnerElement.html( '<textarea class="cell-edit text-cell" >' + that.getCellValue(cell) + '</textarea>' );
					cellInnerElement.addClass('cell-under-edit');
					element = cellInnerElement.find('.text-cell');
					element.focus().select();
					that.time2 = new Date();
					//console.log('lazyTable timeEdit: '+ (that.time2.getTime() - that.time1.getTime()));
					that.cellSave(element, cellId, cell);
					that.canMoveNextEdit = true;
					break;					
				case 'LG_CELL_CONTENT_VOCABULARY':
					cellInnerElement.html( '<div class="cell-edit vocabulary-cell" ></div>' );
					cellInnerElement.addClass('cell-under-edit');
					element = $(cellId).find('.vocabulary-cell');
					
					that.initialData.onLoadCellData(cell);
					that.canMoveNextEdit = true;
					break;
				default:
					break;
			}
		};
		
		this.cellSave = function(element, cellId, cell){
			element.bind('keyup', function (event) {
				switch (event.keyCode) {
					case 27: // Esc
						element.cancel = true;
						element.trigger( "blur" );
						break;
					default:
						break;
				}
			});
			element.on('blur', function(){
				that.onCloseCellEdit(element, cellId, cell);
			});
		};
		
		this.onCloseCellEdit = function(element, cellId, cell){
			if (element.forcedFocus){
				return;
			}
			var cancel = false;
			if (element.cancel){
				cancel = true;
			}
			if( !cancel ){
				var value = element.val();
				that.setCellValue(cell, value);
				if( element.datepickerShowed ){
					return;
				} else {
					$('.xdsoft_datetimepicker').hide();
				}
			}
			var cellElement = $(cellId);
			cellElement.removeClass('cell-under-edit');
			cellElement.parent().removeClass('cell-under-edit');
			
			cellElement.html(cell.contentValue);
			
			$('.xdsoft_datetimepicker').hide();
			
			
			if( !cancel ){
				that.serverEvent('onValueChange', [cell]);
			}
			
			cellElement.parents('.cell').css({
				'z-index':	''
			});
			cellElement.css({
				'overflow': 'hidden'
			});
			delete element;	
		};
		
		this.createCellDatepicker = function(cellId, cell, cellElement){
			$.datetimepicker.setLocale('ru');
			var startDate = new Date(that.getCellValue(cell));
			cellElement.datetimepicker({
				lazyInit: 		true,
				timepicker: 	false,
				dayOfWeekStart: 1,
				format:			'd.m.Y',
				startDate:		startDate,
				onSelectDate:		function(){
					$('.xdsoft_datetimepicker').hide();
					cellElement.datepickerShowed = false;
					cellElement.trigger( "change" );
					cellElement.trigger( "blur" );
				},
				onShow: function(){
					cellElement.datepickerShowed = true;
					that.canMoveNextEdit = true;
				},
				onClose: function(){
					cellElement.datepickerShowed = false;
				}
			});
			
			cellElement.cancel = true;
			
			cellElement.on('change', function(){
				cellElement.cancel = false;
				$(this).val(that.parseDate(cellElement.val(), 'dd.mm.yyyy').getTime());
			});
			cellElement.focus();
			that.cellSave(cellElement, cellId, cell);
		};
		
		this.createCellContentDropdown = function(cellId, cell, cellElement, itemList){
			var cellContainerElement = cellElement.parent();
			cellElement.editableSelect({
				filter: false,
				itemList: itemList,
				effects: 'slide',
				onShow: function () {
					cellElement.forcedFocus = true;
					that.canMoveNextEdit = true;
			    },
			    onHide: function () {
			    	cellElement.forcedFocus = false;
			    },
				onSelect: function (element) {
					cellElement.focus();
			    }
			});
			cellElement = cellContainerElement.find('.list-cell');
			
			cellElement.forcedFocus = false;
			cellElement.val(that.getCellValue(cell));

			that.cellSave(cellElement, cellId, cell);
			cellElement.focus().select();
			that.canMoveNextEdit = true;
		};

		this.createCellContentPopup = function(cellId, cell, cellElement, cellDataList){
			var tableElementWrapper = $('<div class="vocabulary-table-inner"></div>');
			tableElementWrapper.appendTo(cellElement);
			
			var tableElement = $('<table class="ui-widget ui-widget-content vocabulary-table">');
			tableElement.appendTo(tableElementWrapper);
			
			var selectedRow = -1;
			var keyFieldName = cell.contentType.typeParameters.keyField;
			
			dialog = $(cellElement).dialog({
				autoOpen: true,
				height: 300,
				width: 350,
				modal: true,
				buttons: {
					Ok: function() {
						if (selectedRow < 0){
							cellElement.cancel = true;
						} else {
							cellElement.cancel = false;
						}
						dialog.dialog( "close" );
					},
					Cancel: function() {
						cellElement.cancel = true;
						dialog.dialog( "close" );
					}
				},
				close: function() {
					if (cellElement.cancel !== false){
						cellElement.cancel = true;
					}
					that.onCloseCellEdit(cellElement, cellId, cell);
					$(this).dialog('destroy').remove();
				}
			});

			var headerKeyList = [];
			var tableHeaderElement = $('<thead>').appendTo(tableElement);
			
			tRow = $('<tr class="ui-widget-header">');
			tableHeaderElement.append(tRow);
			$.each(cell.contentType.typeParameters, function(key, value) {
				var headerNameMatch = key.match(".headerName$");
				if (!headerNameMatch){
					return;
				}
				var headerNameKey = key.replace(headerNameMatch, "");
				headerKeyList.push(headerNameKey);
				
				tHeader = $('<th>').html(value);
				tRow.append(tHeader);
			});
			
			var tableBodyElement = $('<tbody>').appendTo(tableElement);
			
			$.each(cellDataList, function(n, r) {
				tRow = $('<tr>');
				$.each(headerKeyList, function(key, headerKey){
					tCell = $('<td>').html(r[headerKey]);
					tRow.append(tCell);
				});
				tableBodyElement.append(tRow);
			});
			$(tableBodyElement).selectable({
				filter: 'tr',
				selecting: function(event, ui){
		            if(tableBodyElement.find(".ui-selected, .ui-selecting").length > 1){
		                  $(ui.selecting).removeClass("ui-selecting");
		            }
				},
				stop: function() {
					$( ".ui-selected", this ).each(function() {
						var index = $(this).index();
						selectedRow = index;
						var selectedItem = cellDataList[index];
						var selectedValue = selectedItem[keyFieldName];
						cellElement.val(selectedValue);
					});
				}
			});
		};		
		
		this.createCellContentList = function(cellId, cell, element, itemList){
			if ("popup" === cell.contentType.typeParameters.selectMode){
				that.createCellContentPopup(cellId, cell, element, itemList);
			} else {
				var keyFieldName = cell.contentType.typeParameters.keyField;
				var keyItemList = [];
				$.each(itemList, function(key, listItem){
					keyItemList.push(listItem[keyFieldName]);
				});
				that.createCellContentDropdown(cellId, cell, element, keyItemList);
			}
		};
		
		this.loadCellData = function(cell, cellDataList){
			var cellId = '#r'+cell.rowIndex+'c'+cell.colIndex+'-'+that.tableIdSalt+ ' .cell-inner';
			var cellElement = $(cellId).find('.list-cell');
			that.createCellContentList(cellId, cell, cellElement, cellDataList);
		};
		
		this.displayTable = function(){
			var tableId = 'lazyTable-'+that.tableIdSalt;
			if( !$('#'+tableId).length ){
				$('<div/>',{
					'id': tableId,
					'class': 'lazy-grid-table' 
				}).appendTo(that.tableWrapper);
				$('#'+tableId).css({
					'height': that.realTableHeight,
					'width': that.realTableWidth
				});
				
				if( that.tablePositionY !== 0 ){
					that.tableWrapper.scrollTop(that.tablePositionY);
				}
				
				if( that.tablePositionX !== 0 ){
					that.tableWrapper.scrollLeft(that.tablePositionX);
				}
				
				
				that.selectArea.cellPosition = {};
				that.selectArea.pixelPosition = {};
				that.selectArea.startCell = {
					'row': -1,
					'col': -1
				};
				that.selectArea.lastCell = {
					'row': -1,
					'col': -1
				};
				if( 
					$('#'+tableId).height() !== that.realTableHeight ||
					$('#'+tableId).width() !== that.realTableWidth
				){
					return true;
				}
			}
			
			var cellRow = 0;
			var cellCol = 0;
			var timeSum = 0;
			var offsetTop = 0;
			var offsetTopSave = 0;
			var offsetLeft = 0;
			var offsetLeftSave = 0;
			var height = 0;
			var tableStr = '';
			var tableElement = document.getElementById(tableId);
			var fixedColWrapper = document.getElementById('lazy-table-fixed-column-container-'+that.tableIdSalt);
			var fixedRowWrapper = document.getElementById('lazy-table-fixed-row-container-'+that.tableIdSalt);
			var deleteCell = true;
			
			
			var currentRowIndex;
			var currentColIndex;
			var fixedRowIndex;
			var fixedColIndex;
			var itemId;
			var testElement;
			
			var testTop = -1;
			var testBottom = -1;
			
			var i = 0;
			var j = 0;
			
			$('#lazyTable-'+that.tableIdSalt).find('.cell').each(function(key, item){
				var elem = $(item);
				var deleteItem;
				
				var itemCol = $(item).data('col');
				var itemRow = $(item).data('row');
				if( 
					(
						itemRow < that.realTableRange.top || 
						itemRow > that.realTableRange.bottom ||
						itemCol < that.realTableRange.left ||
						itemCol > that.realTableRange.right
					) &&
					!elem.hasClass('cell-colfixed') &&
					!elem.hasClass('cell-rowfixed')
				){
					if( elem.hasClass('cell-union') ){
						deleteCell = true;
						for( j = 0; j < that.cellsUnions.union.length; j++ ){
							i = that.cellsUnions.union[j];
							if( typeof(that.cellsUnions.displayedRanges[i]) !== 'undefined' ){
								if(
									that.meta.cellSpanList[i].left === itemCol &&
									that.meta.cellSpanList[i].top === itemRow
								){
									deleteCell = false;
								}
							}
						}
						if( deleteCell ){
							tableElement.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt));
						}
					} else {
						tableElement.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt));
					}
				}
			});
			
			for( i = 0; i < that.tableCellRange.top; i++ ){
				offsetTop += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
			}
			for( i = 0; i < that.tableCellRange.left; i++ ){
				offsetLeft += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
			}
			offsetLeftSave = offsetLeft;
			offsetTopSave = offsetTop;
			for( cellRow = that.tableCellRange.top; cellRow <= that.tableCellRange.bottom; cellRow++ ){
				height = typeof(that.realRows[cellRow]) !== 'undefined'? that.realRows[cellRow].height : that.meta.defaultRow.height;
				for( cellCol = that.tableCellRange.left; cellCol <= that.tableCellRange.right; cellCol++ ){
					currentRowIndex = cellRow;
					currentColIndex = cellCol;
					var _oldindex = -1;
					var cells = {
						top: {},
						left: {}
					};
					
					itemId = 'r'+currentRowIndex+'c'+currentColIndex+'-'+that.tableIdSalt;
					i = 0;
					if( !$('#'+itemId).length ){
						tableStr += '<div id="'+ itemId +'"' + ' class="'+'cell r'+currentRowIndex+' c'+currentColIndex+'"' + ' data-row="'+currentRowIndex+'"' +
							' data-col="'+currentColIndex+'"' + 'style="width:'+ (typeof(that.realColumns[currentColIndex]) !== 'undefined'? that.realColumns[currentColIndex].width : that.meta.defaultColumn.width)+'px;height:'+height+'px;top:'+offsetTop+'px;left:'+offsetLeft+'px;">'+
							'<div class="cell-inner" data-row="'+currentRowIndex+'"' +
							' data-col="'+currentColIndex+'"' + 'style="width:'+ (typeof(that.realColumns[currentColIndex]) !== 'undefined'? that.realColumns[currentColIndex].width : that.meta.defaultColumn.width)+'px;height:'+height+'px;"></div>'+
							'</div>';
					}
					offsetLeft += typeof(that.realColumns[cellCol]) !== 'undefined'? that.realColumns[cellCol].width : that.meta.defaultColumn.width;
				}
				offsetLeft = offsetLeftSave;
				offsetTop += typeof(that.realRows[cellRow]) !== 'undefined'? that.realRows[cellRow].height : that.meta.defaultRow.height;  
			}
			document.getElementById(tableId).insertAdjacentHTML('beforeend', tableStr);
			
			that.disableMergedUnions();
			that.expandUnionCells();
			
			var ui = 0;
			
			that.additionalFixedRows = [];
			that.additionalFixedRows.length = 0;
			for( fixedRowIndex in that.displayedFixedRows ){
				for( ui = 0; ui < that.cellsUnions.union.length; ui++ ){
					unionid = that.cellsUnions.union[ui];
					if( 
						that.meta.cellSpanList[unionid].top <= parseInt(fixedRowIndex) &&
						that.meta.cellSpanList[unionid].bottom >= parseInt(fixedRowIndex)
					){
						for( var b1 = that.meta.cellSpanList[unionid].top; b1 <= that.meta.cellSpanList[unionid].bottom; b1++ ){
							that.displayedFixedRows[b1] = typeof(that.realRows[b1]) !== 'undefined'?
								that.realRows[b1] : that.meta.defaultRow;
							that.additionalFixedRows[b1] = that.meta.cellSpanList[unionid].top;
							that.additionalFixedRows['_'+that.meta.cellSpanList[unionid].top] = that.additionalFixedRows['_'+that.meta.cellSpanList[unionid].top] || [];
							that.additionalFixedRows['_'+that.meta.cellSpanList[unionid].top][b1] = that.displayedFixedRows[b1];
						}
					}
				}
			}
			
			that.additionalFixedColumns = [];
			that.additionalFixedColumns.length = 0;
			for( fixedColIndex in that.displayedFixedColumns ){
				for( ui = 0; ui < that.cellsUnions.union.length; ui++ ){
					unionid = that.cellsUnions.union[ui];
					if( 
						that.meta.cellSpanList[unionid].left <= parseInt(fixedColIndex) &&
						that.meta.cellSpanList[unionid].right >= parseInt(fixedColIndex)
					){
						for( var b2 = that.meta.cellSpanList[unionid].left; b2 <= that.meta.cellSpanList[unionid].right; b2++ ){
							that.displayedFixedColumns[b2] = typeof(that.realColumns[b2]) !== 'undefined'?
								that.realColumns[b2] : that.meta.defaultColumn;
							that.additionalFixedColumns[b2] = that.meta.cellSpanList[unionid].left;
							that.additionalFixedColumns['_'+that.meta.cellSpanList[unionid].left] = that.additionalFixedColumns['_'+that.meta.cellSpanList[unionid].left] || [];
							that.additionalFixedColumns['_'+that.meta.cellSpanList[unionid].left][b2] = true;
						}
					}
				}
			}
			
			var fixedColContainerId = 'lazy-table-fixed-column-container-'+that.tableIdSalt;
			var fixedColContainerWrapperId = 'lazy-table-fixed-column-wrapper-'+that.tableIdSalt;
			var fixedRowContainerId = 'lazy-table-fixed-row-container-'+that.tableIdSalt;
			var fixedRowContainerWrapperId = 'lazy-table-fixed-row-wrapper-'+that.tableIdSalt;
			var showedFixedColumns = [];
			var showedFixedRows = [];
			
			//if( that.needRebuild ){
				
				var fixedOffsetLeft = 0;
				var fixedOffsetTop = 0;
				var fixedColStr = '';
				var fixedRowStr = '';
				var innerCell = '';
				var additionalRanges = {
					top: -1,
					bottom: -1,
					left: -1,
					right: -1
				};
				var unionId;
				var heightS = 0;
				var widthS = 0;
				
				var tempFixedColIndex;
				var tempFixedRowIndex;
				
				var ka;
				var kk;
				var fuIndex;
				var h;
				var w;
				//// fixed rows
				for( fixedRowIndex in that.displayedFixedRows ){
					if( typeof(that.displayedFixedRows[fixedRowIndex]) === 'object' ){
						if( !$('#'+'r'+fixedRowIndex+'c'+that.realTableRange.right+'-'+that.tableIdSalt).length ){
							if( fixedRowIndex >= that.realTableRange.top ){
								var tempOffsetTop = 0;
								height = typeof(that.realRows[fixedRowIndex]) !== 'undefined'? that.realRows[fixedRowIndex].height : that.meta.defaultRow.height;
								for( i = 0; i < fixedRowIndex; i++ ){
									tempOffsetTop += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
								}
								offsetLeft = offsetLeftSave;
								tableStr = '';
								for( kk = that.realTableRange.left; kk <= that.realTableRange.right; kk++ ){
									currentRowIndex = fixedRowIndex;
									currentColIndex = kk;
									itemId = 'r'+currentRowIndex+'c'+currentColIndex+'-'+that.tableIdSalt;
									if( !$('#'+itemId).length ){
										tableStr += '<div id="'+ itemId +'"' + ' class="'+'cell r'+currentRowIndex+' c'+currentColIndex+'"' + ' data-row="'+currentRowIndex+'"' +
											' data-col="'+currentColIndex+'"' + 'style="width:'+ (typeof(that.realColumns[currentColIndex]) !== 'undefined'? that.realColumns[currentColIndex].width : that.meta.defaultColumn.width)+'px;height:'+height+'px;top:'+tempOffsetTop+'px;left:'+offsetLeft+'px;">'+
											'<div class="cell-inner" data-row="'+currentRowIndex+'"' +
											' data-col="'+currentColIndex+'"' + 'style="width:'+ (typeof(that.realColumns[currentColIndex]) !== 'undefined'? that.realColumns[currentColIndex].width : that.meta.defaultColumn.width)+'px;height:'+height+'px;"></div>'+
											'</div>';
									}
									offsetLeft += typeof(that.realColumns[currentColIndex]) !== 'undefined'? that.realColumns[currentColIndex].width : that.meta.defaultColumn.width;
								}
								document.getElementById(tableId).insertAdjacentHTML('beforeend', tableStr);
							}						
						}
						testElement = $('#'+'r'+fixedRowIndex+'c'+that.realTableRange.right+'-'+that.tableIdSalt);
						if( testElement.length ){
							if( (testElement.offset().top - $(that.tableWrapper).offset().top) < fixedOffsetTop ){
								showedFixedRows[fixedRowIndex] = that.displayedFixedRows[fixedRowIndex];
							}
						} else {
							showedFixedRows[fixedRowIndex] = that.displayedFixedRows[fixedRowIndex];
						}
						fixedOffsetTop += typeof(that.realRows[fixedRowIndex]) !== 'undefined'? 
							that.realRows[fixedRowIndex].height : that.meta.defaultRow.height;
					}
				}
				
				if( showedFixedRows.length ){
					for( fixedRowIndex in showedFixedRows ){
						if( typeof(that.additionalFixedRows['_'+fixedRowIndex]) !== 'undefined' ){
							for( fuIndex in that.additionalFixedRows['_'+fixedRowIndex] ){
								if( typeof(that.additionalFixedRows['_'+fixedRowIndex][fuIndex]) === 'object' ){
									if( typeof(showedFixedRows[fuIndex]) === 'undefined' ){
										showedFixedRows[fuIndex] = that.additionalFixedRows['_'+fixedRowIndex][fuIndex];
									}
								}
							}
						}
					}
				}
				
				///// fixed columns
				for( fixedColIndex in that.displayedFixedColumns ){
					if( typeof(that.displayedFixedColumns[fixedColIndex]) === 'object' ){
						if( !$('#'+'r'+fixedColIndex+'c'+that.realTableRange.bottom+'-'+that.tableIdSalt).length ){
							if( fixedColIndex >= that.realTableRange.left ){
								var tempOffsetLeft = 0;
								width = typeof(that.realColumns[fixedColIndex]) !== 'undefined'? that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
								for( i = 0; i < fixedColIndex; i++ ){
									tempOffsetLeft += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
								}
								offsetTop = offsetTopSave;
								tableStr = '';
								for( kk = that.realTableRange.top; kk <= that.realTableRange.bottom; kk++ ){
									currentRowIndex = kk;
									currentColIndex = fixedColIndex;
									itemId = 'r'+currentRowIndex+'c'+currentColIndex+'-'+that.tableIdSalt;
									if( !$('#'+itemId).length ){
										tableStr += '<div id="'+ itemId +'"' + ' class="'+'cell r'+currentRowIndex+' c'+currentColIndex+'"' + ' data-row="'+currentRowIndex+'"' +
											' data-col="'+currentColIndex+'"' + 'style="width:'+ width +'px;height:'+(typeof(that.realRows[currentRowIndex]) !== 'undefined'? that.realRows[currentRowIndex].height : that.meta.defaultRow.height)+'px;top:'+offsetTop+'px;left:'+tempOffsetLeft+'px;">'+
											'<div class="cell-inner" data-row="'+currentRowIndex+'"' +
											' data-col="'+currentColIndex+'"' + 'style="width:'+ width+'px;height:'+(typeof(that.realRows[currentRowIndex]) !== 'undefined'? that.realRows[currentRowIndex].height : that.meta.defaultRow.height)+'px;"></div>'+
											'</div>';
									}
									offsetTop += typeof(that.realRows[currentRowIndex]) !== 'undefined'? that.realRows[currentRowIndex].height : that.meta.defaultRow.height;
								}
								document.getElementById(tableId).insertAdjacentHTML('beforeend', tableStr);
							}						
						}
						testElement = $('#'+'r'+that.realTableRange.bottom+'c'+fixedColIndex+'-'+that.tableIdSalt);
						if( testElement.length ){
							if( (testElement.offset().left - $(that.tableWrapper).offset().left ) < fixedOffsetLeft ){
								showedFixedColumns[fixedColIndex] = that.displayedFixedColumns[fixedColIndex];
							}
						} else {
							showedFixedColumns[fixedColIndex] = that.displayedFixedColumns[fixedColIndex];
						}
						fixedOffsetLeft += typeof(that.realColumns[fixedColIndex]) !== 'undefined'? 
							that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
					}
				}
				
				if( showedFixedColumns.length ){
					for( fixedColIndex in showedFixedColumns ){
						if( typeof(that.additionalFixedColumns['_'+fixedColIndex]) !== 'undefined' ){
							for( fuIndex in that.additionalFixedColumns['_'+fixedColIndex] ){
								if( typeof(that.additionalFixedColumns['_'+fixedColIndex][fuIndex]) === 'object' ){
									if( typeof(showedFixedRows[fuIndex]) === 'undefined' ){
										showedFixedRows[fuIndex] = that.additionalFixedColumns['_'+fixedColIndex][fuIndex];
									}
								}
							}
						}
					}
				}
				
				
				
				$('#lazy-table-fixed-row-container-'+that.tableIdSalt).find('.cell-rowfixed').each(function(key, item){
					var itemRow = $(item).data('row');
					var itemCol = $(item).data('col');
					if( 
						itemCol < that.realTableRange.left ||
						itemCol > that.realTableRange.right || 
						typeof(showedFixedRows[itemRow]) === 'undefined'
					){
						var unionid = $(item).find('.cell-inner').data('unionid');
						if( typeof(unionid) !== 'undefined' ){
							if( 
								that.meta.cellSpanList[unionid].bottom < that.realTableRange.top ||
								that.meta.cellSpanList[unionid].right < that.realTableRange.left
							){
								fixedRowWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt+'-rowfixed'));
							}
						} else{
							fixedRowWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt+'-rowfixed'));
						}
					}
				});
				
				if( showedFixedRows.length ){
					for( fixedRowIndex in showedFixedRows ){
						if( typeof(that.additionalFixedRows['_'+fixedRowIndex]) !== 'undefined' ){
							for( fuIndex in that.additionalFixedRows['_'+fixedRowIndex] ){
								if( typeof(that.additionalFixedRows['_'+fixedRowIndex][fuIndex]) === 'object' ){
									if( typeof(showedFixedRows[fuIndex]) === 'undefined' ){
										showedFixedRows[fuIndex] = that.additionalFixedRows['_'+fixedRowIndex][fuIndex];
									}
								}
							}
						}
					}
					if( !$('#'+fixedRowContainerId).length ){
						$('<div/>',{
							'id': fixedRowContainerWrapperId,
							'class': 'lazy-table-fixed-row-wrapper',
							'css': {
								'position': 'absolute',
								'top': -1,
								'left': 0,
								'width' : that.tableWrapper.width() - that.scrollBarWidth
							}
						}).appendTo(that.tableWrapper);
						
						$('<div/>',{
							'id': fixedRowContainerId,
							'class': 'lazy-table-fixed-row-container',
							'css': {
								'position': 'absolute',
								'top': 0,
								'left': -that.tablePositionX || 0,
								'height' : that.realTableWidth
							}
						}).appendTo('#'+fixedRowContainerWrapperId);
					}
					offsetLeft = offsetLeftSave;
					offsetTop = 0;
					
					for( fixedRowIndex in showedFixedRows ){
						if( typeof(showedFixedRows[fixedRowIndex]) === 'object' ){
							additionalRanges.top = parseInt(fixedRowIndex);
							additionalRanges.bottom = parseInt(fixedRowIndex);
							for( fixedColIndex = that.tableCellRange.left; fixedColIndex <= that.tableCellRange.right; fixedColIndex++ ){
								unionid = -1;
								elementCell = $('#r'+fixedRowIndex+'c'+fixedColIndex+'-'+that.tableIdSalt);
								fixedRowItemId = 'r'+fixedRowIndex+'c'+fixedColIndex+'-'+that.tableIdSalt+'-rowfixed';
								elementCellFixed = $('#'+fixedRowItemId);
								width = typeof(that.realColumns[fixedColIndex]) !== 'undefined'? 
									that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
								innerCell = '<div class="cell-inner" data-row="'+fixedRowIndex+'"' +
											' data-col="'+fixedColIndex+'"' + 'style="width:'+ width +'px;height:'+showedFixedRows[fixedRowIndex].height+'px;"></div>';
								
								if( elementCell.length ){
									unionid = typeof(elementCell.data('unionid')) !== 'undefined' ? elementCell.data('unionid'): -1 ;
									innerCell = elementCell.html();
									elementCell.remove();
								} else {
									unionid = that.getUnionId(fixedRowIndex, fixedColIndex);
									if( !elementCellFixed.find('.cell-filled').length ){
										that.needRebuild = true;
										if( additionalRanges.left === -1 ){
											if( unionid === -1 ){
												additionalRanges.left = fixedColIndex;
											}else if( !$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-rowfixed').length ) {
												additionalRanges.left = that.meta.cellSpanList[unionid].left;
												tempFixedColIndex = fixedColIndex;
												fixedColIndex = that.meta.cellSpanList[unionid].left;
												for( ka = fixedColIndex; ka < tempFixedColIndex; ka++ ){
													offsetLeft -= typeof(that.realColumns[fixedColIndex]) !== 'undefined'? 
														that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
												}
											}
										}
										additionalRanges.right = fixedColIndex;
									}
								}
								if( !elementCellFixed.length ){
									fixedRowStr = '<div id="'+ fixedRowItemId +'"' + ' class="'+'cell cell-rowfixed r'+fixedRowIndex+' c'+fixedColIndex+'"' + 
											' data-row="'+fixedRowIndex+'"' +
											' data-col="'+fixedColIndex+'"' + 
											'style="width:'+ width +'px;height:'+showedFixedRows[fixedRowIndex].height+'px;top:'+offsetTop+'px;left:'+offsetLeft+'px;">'+
											innerCell+
											'</div>';
									$('#'+fixedRowContainerId).append(fixedRowStr);
									if( unionid !== -1  ){
										$('#'+fixedRowItemId).data('unionid', unionid);
										$('#'+fixedRowItemId).find('.cell-inner').data('unionid', unionid);
										if( 
											that.meta.cellSpanList[unionid].left === parseInt(fixedColIndex) && 
											that.meta.cellSpanList[unionid].top === parseInt(fixedRowIndex)
										){
											for( w = that.meta.cellSpanList[unionid].left; w <= that.meta.cellSpanList[unionid].right; w++ ){
												widthS += typeof(that.realColumns[w]) !== 'undefined'? 
													that.realColumns[w].width : that.meta.defaultColumn.width;
											}
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-rowfixed').css('width', widthS+'px');
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-rowfixed').css({
												'z-index' : 2
											});
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-rowfixed'+' .cell-inner').css('width', widthS+'px');
											widthS = 0;
										}
										if( 
											that.meta.cellSpanList[unionid].left === parseInt(fixedColIndex) && 
											that.meta.cellSpanList[unionid].top === parseInt(fixedRowIndex)
										){
											for( h = that.meta.cellSpanList[unionid].top; h <= that.meta.cellSpanList[unionid].bottom; h++ ){
												heightS += typeof(that.realRows[h]) !== 'undefined'? 
													that.realRows[h].height : that.meta.defaultRow.height;
											}
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-rowfixed').css('height', heightS+'px');
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-rowfixed'+' .cell-inner').css('height', heightS+'px');
											heightS = 0;
										}
									}
								}
								offsetLeft += width;
							}
							if( 
								additionalRanges.left !== -1 &&
								additionalRanges.right !== -1 &&
								that.needRebuild
							){
								//that.tableServerCellRange.push(additionalRanges);
								that.tableServerCellRange.push({
									top: parseInt(fixedRowIndex),
									bottom: parseInt(fixedRowIndex),
									left: additionalRanges.left,
									right: additionalRanges.right
								});
							}
							offsetTop += showedFixedRows[fixedRowIndex].height;
							offsetLeft = offsetLeftSave;
						}
					}
					fixedRowsHeight = offsetTop;
					$('#'+fixedRowContainerId).css('height', fixedRowsHeight);
					$('#'+fixedRowContainerWrapperId).css('height', fixedRowsHeight);
				}
				
				$('#lazy-table-fixed-column-container-'+that.tableIdSalt).find('.cell-colfixed').each(function(key, item){
					var itemRow = $(item).data('row');
					var itemCol = $(item).data('col');
					if( 
						itemRow < that.realTableRange.top || 
						itemRow > that.realTableRange.bottom ||
						typeof(showedFixedColumns[itemCol]) === 'undefined'
					){
						var unionid = $(item).find('.cell-inner').data('unionid');
						if( typeof(unionid) !== 'undefined' ){
							if( 
								that.meta.cellSpanList[unionid].bottom < that.realTableRange.top ||
								that.meta.cellSpanList[unionid].right < that.realTableRange.left
							){
								fixedColWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt+'-colfixed'));
							}
						} else{
							fixedColWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt+'-colfixed'));
						}
					}
				});
				
				if( showedFixedColumns.length ){
					for( fixedColIndex in showedFixedColumns ){
						if( typeof(that.additionalFixedColumns['_'+fixedColIndex]) !== 'undefined' ){
							for( fuIndex in that.additionalFixedColumns['_'+fixedColIndex] ){
								if( typeof(that.additionalFixedColumns['_'+fixedColIndex][fuIndex]) === 'object' ){
									if( typeof(showedFixedRows[fuIndex]) === 'undefined' ){
										showedFixedRows[fuIndex] = that.additionalFixedColumns['_'+fixedColIndex][fuIndex];
									}
								}
							}
						}
					}
					
				
					if( !$('#'+fixedColContainerId).length ){
						$('<div/>',{
							'id': fixedColContainerWrapperId,
							'class': 'lazy-table-fixed-column-wrapper',
							'css': {
								'position': 'absolute',
								'top': 0,
								'left': -1,
								'height' : that.tableWrapper.height() - that.scrollBarWidth
							}
						}).appendTo(that.tableWrapper);
						
						$('<div/>',{
							'id': fixedColContainerId,
							'class': 'lazy-table-fixed-column-container',
							'css': {
								'position': 'absolute',
								'top': -that.tablePositionY || 0,
								'left': 0,
								'height' : that.realTableHeight
							}
						}).appendTo('#'+fixedColContainerWrapperId);
					}
					offsetLeft = 0;
					offsetTop = offsetTopSave;
					
					for( fixedColIndex in showedFixedColumns ){
						if( typeof(showedFixedColumns[fixedColIndex]) === 'object' ){
							additionalRanges.left = parseInt(fixedColIndex);
							additionalRanges.right = parseInt(fixedColIndex);
							for( fixedRowIndex = that.tableCellRange.top; fixedRowIndex <= that.tableCellRange.bottom; fixedRowIndex++ ){
								unionid = -1;
								elementCell = $('#r'+fixedRowIndex+'c'+fixedColIndex+'-'+that.tableIdSalt);
								fixedColItemId = 'r'+fixedRowIndex+'c'+fixedColIndex+'-'+that.tableIdSalt+'-colfixed';
								elementCellFixed = $('#'+fixedColItemId);
								height = typeof(that.realRows[fixedRowIndex]) !== 'undefined'? 
									that.realRows[fixedRowIndex].height : that.meta.defaultRow.height;
								innerCell = '<div class="cell-inner" data-row="'+fixedRowIndex+'"' +
											' data-col="'+fixedColIndex+'"' + 'style="width:'+ showedFixedColumns[fixedColIndex].width +'px;height:'+height+'px;"></div>';
								
								if( elementCell.length ){
									unionid = typeof(elementCell.data('unionid')) !== 'undefined' ? elementCell.data('unionid'): -1 ;
									innerCell = elementCell.html();
									elementCell.remove();
								} else {
									unionid = that.getUnionId(fixedRowIndex, fixedColIndex);
									if( !elementCellFixed.find('.cell-filled').length ){
										that.needRebuild = true;
										if( additionalRanges.top === -1 ){
											if( unionid === -1 ){
												additionalRanges.top = fixedRowIndex;
											}else if( !$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-rowfixed').length ){
												additionalRanges.top = that.meta.cellSpanList[unionid].top;
												tempFixedRowIndex = fixedRowIndex;
												fixedRowIndex = that.meta.cellSpanList[unionid].top;
												for( ka = fixedRowIndex; ka < tempFixedRowIndex; ka++ ){
													offsetTop -= typeof(that.realRows[fixedRowIndex]) !== 'undefined'? 
														that.realRows[fixedRowIndex].height : that.meta.defaultRow.height;
												}
											}
										}
										additionalRanges.bottom = fixedRowIndex;
									}
								}
								if( !elementCellFixed.length ){
									fixedColStr = '<div id="'+ fixedColItemId +'"' + ' class="'+'cell cell-colfixed r'+fixedRowIndex+' c'+fixedColIndex+'"' + 
											' data-row="'+fixedRowIndex+'"' +
											' data-col="'+fixedColIndex+'"' + 'style="width:'+ showedFixedColumns[fixedColIndex].width +'px;height:'+height+'px;top:'+offsetTop+'px;left:'+offsetLeft+'px;">'+
											innerCell+
											'</div>';
									$('#'+fixedColContainerId).append(fixedColStr);
									if( unionid !== -1  ){
										$('#'+fixedColItemId).data('unionid', unionid);
										$('#'+fixedColItemId).find('.cell-inner').data('unionid', unionid);
										if( that.meta.cellSpanList[unionid].left === parseInt(fixedColIndex) && 
											that.meta.cellSpanList[unionid].top === parseInt(fixedRowIndex)
										){
											for( h = that.meta.cellSpanList[unionid].top; h <= that.meta.cellSpanList[unionid].bottom; h++ ){
												heightS += typeof(that.realRows[h]) !== 'undefined'? 
													that.realRows[h].height : that.meta.defaultRow.height;
											}
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-colfixed').css('height', heightS+'px');
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-colfixed').css({
												'z-index' : 2
											});
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-colfixed'+' .cell-inner').css('height', heightS+'px');
											heightS = 0;
										}
										if( that.meta.cellSpanList[unionid].left === parseInt(fixedColIndex) && 
											that.meta.cellSpanList[unionid].top === parseInt(fixedRowIndex)
										){
											for( w = that.meta.cellSpanList[unionid].left; w <= that.meta.cellSpanList[unionid].right; w++ ){
												widthS += typeof(that.realColumns[w]) !== 'undefined'? 
													that.realColumns[w].width : that.meta.defaultColumn.width;
											}
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-colfixed').css('width', widthS+'px');
											$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableIdSalt+'-colfixed'+' .cell-inner').css('width', widthS+'px');
											widthS = 0;
										}
									}
								}
								offsetTop += height;
							}
							
							if( 
								additionalRanges.top !== -1 &&
								additionalRanges.bottom !== -1 &&
								that.needRebuild
							){
								//that.tableServerCellRange.push(additionalRanges);
								that.tableServerCellRange.push({
									top: additionalRanges.top,
									bottom: additionalRanges.bottom,
									left: parseInt(fixedColIndex),
									right: parseInt(fixedColIndex)
								});
							}
							offsetLeft += showedFixedColumns[fixedColIndex].width;
							offsetTop = offsetTopSave;
						}
					}
					fixedColumnsWidth = offsetLeft;
					$('#'+fixedColContainerId).css('width', fixedColumnsWidth);
					$('#'+fixedColContainerWrapperId).css('width', fixedColumnsWidth);
				}
				
				if( showedFixedRows.length === 0 && $('#'+fixedRowContainerWrapperId).length ){
					$('#'+fixedRowContainerWrapperId).remove();
				}
				
				if( showedFixedColumns.length === 0 && $('#'+fixedColContainerWrapperId).length ){
					$('#'+fixedColContainerWrapperId).remove();
				}
				
				$('#lazyTable-'+that.tableIdSalt+'-wrapper .cell-rowfixed').each(function(key, item){
					var rowIndex = $(item).data('row');
					var colIndex = $(item).data('col');
					delElement = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt);
					if( delElement.length ){
						delElement.remove();
					}
				});
				
				$('#lazyTable-'+that.tableIdSalt+'-wrapper .cell-colfixed').each(function(key, item){
					var rowIndex = $(item).data('row');
					var colIndex = $(item).data('col');
					delElement = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt);
					if( delElement.length ){
						delElement.remove();
					}
				});
				
				$('#lazyTable-'+that.tableIdSalt+'-wrapper .cell:not(.passive-union-part) .cell-inner:not(.cell-filled)').each(function(key, item){
					var rowIndex = $(item).data('row');
					var colIndex = $(item).data('col');
					if( typeof(that.data[rowIndex]) !== 'undefined' ){
						if( that.data[rowIndex][colIndex] !== 'undefined' ){
							that.createCellContent(that.data[rowIndex][colIndex]);
						}
					}
				});
				
			
			var tempData = that.data;
			that.data = [];
			that.data.length = 0;
			for( cellRow = that.realTableRange.top; cellRow <= that.realTableRange.bottom; cellRow++ ){
				for( cellCol = that.realTableRange.left; cellCol <= that.realTableRange.right; cellCol++ ){
					if( typeof(tempData[cellRow]) !== 'undefined' ){
						if( typeof(tempData[cellRow][cellCol]) !== 'undefined' ){
							if( typeof(that.data[cellRow]) !== 'undefined' ){
								that.data[cellRow][cellCol] = tempData[cellRow][cellCol];
							} else {
								that.data[cellRow] = [];
								that.data[cellRow][cellCol] = tempData[cellRow][cellCol];
							}
						}
					}
				}
			}
			
			$('.cell-colfixed').each(function(key, item){
				var rowIndex = $(item).data('row');
				var colIndex = $(item).data('col');
				if( typeof(tempData[rowIndex]) !== 'undefined' ){
					if( typeof(tempData[rowIndex][colIndex]) !== 'undefined' ){
						if( typeof(that.data[rowIndex]) !== 'undefined' ){
							that.data[rowIndex][colIndex] = tempData[rowIndex][colIndex];
						} else {
							that.data[rowIndex] = [];
							that.data[rowIndex][colIndex] = tempData[rowIndex][colIndex];
						}
					}
				}
			});
			
			$('.cell-rowfixed').each(function(key, item){
				var rowIndex = $(item).data('row');
				var colIndex = $(item).data('col');
				if( typeof(tempData[rowIndex]) !== 'undefined' ){
					if( typeof(tempData[rowIndex][colIndex]) !== 'undefined' ){
						if( typeof(that.data[rowIndex]) !== 'undefined' ){
							that.data[rowIndex][colIndex] = tempData[rowIndex][colIndex];
						} else {
							that.data[rowIndex] = [];
							that.data[rowIndex][colIndex] = tempData[rowIndex][colIndex];
						}
					}
				}
			});
			
			/*$('#lazyTable-'+that.tableIdSalt+' .cell-inner:not(.cell-filled)').each(function(key, item){
				var rowIndex = $(item).data('row');
				var colIndex = $(item).data('col');
				that.createCellContent(that.data[rowIndex][colIndex]);
			});*/
			
			if( !that.needRebuild ){
				that.stopTab = false;
			}
			
			return false;
		};
		
		this.determinateRealTableSize = function(){
			var i;
			for( i = 0; i < that.meta.colCount; i++ ){
				that.realTableWidth += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width; 
			}
			for( i = 0; i < that.meta.rowCount; i++ ){
				that.realTableHeight += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height; 
			}
		};
		
		this.determinateDisplayedCellsAndRows = function(){
			var offsetTop = that.tablePositionY || that.tableWrapper.scrollTop();
			var offsetLeft = that.tablePositionX || that.tableWrapper.scrollLeft();
			var tableWidth = that.tableWrapper.width();
			var tableHeight = that.tableWrapper.height();
			
			var tempTop = 0;
			var tempLeft = 0;
			var offsetTopCells = 0;
			var offsetLeftCells = 0;
			
			while( tempLeft < offsetLeft ){
				if( offsetLeftCells <= that.meta.colCount ){
					tempLeft += typeof(that.realColumns[offsetLeftCells]) !== 'undefined'? that.realColumns[offsetLeftCells].width : that.meta.defaultColumn.width; 
					offsetLeftCells++;
				} else {
					tempLeft = offsetLeft;
				}
			}
			
			while( tempTop < offsetTop ){
				if( offsetTopCells <= that.meta.rowCount ){
					tempTop += typeof(that.realRows[offsetTopCells]) !== 'undefined'? that.realRows[offsetTopCells].height : that.meta.defaultRow.height; 
					offsetTopCells++;
				} else {
					tempTop = offsetTop;
				}
			}
			
			that.cellLeft = offsetLeftCells;
			that.cellRight = offsetLeftCells;
			that.cellTop = offsetTopCells;
			that.cellBottom = offsetTopCells;
			
			tempLeft = offsetLeft + tableWidth;
			
			do{
				if( that.cellRight <= that.meta.colCount ){
					tempLeft -= typeof(that.realColumns[that.cellRight]) !== 'undefined'? that.realColumns[that.cellRight].width : that.meta.defaultColumn.width;
					that.cellRight++;
				} else {
					tempLeft = offsetLeft;
				}
			}while( tempLeft > offsetLeft );
			
			tempTop = offsetTop + tableHeight;
			
			do{
				if( that.cellBottom <= that.meta.rowCount ){
					tempTop -= typeof(that.realRows[that.cellBottom]) !== 'undefined'? that.realRows[that.cellBottom].height : that.meta.defaultRow.height;
					that.cellBottom++;
				} else {
					tempTop = offsetTop;
				}
			}while( tempTop > offsetTop );
			
			that.cellLeft -= that.cellOffset;
			that.cellTop -= that.cellOffset;
			that.cellRight += that.cellOffset;
			that.cellBottom += that.cellOffset;
			
			that.cellLeft = that.cellLeft < 0? 0 : that.cellLeft;
			that.cellTop = that.cellTop < 0 ? 0 : that.cellTop;
			that.cellRight = that.cellRight >= that.meta.colCount? (that.meta.colCount-1) : that.cellRight;
			that.cellBottom = that.cellBottom >= that.meta.rowCount? (that.meta.rowCount-1) : that.cellBottom;
			
			////////////
			
			var cellsWidth = that.cellRight - that.cellLeft;
			var cellsHeight = that.cellBottom - that.cellTop;
			
			var merged = {
				left: that.cellLeft,
				top: that.cellTop,
				right: that.cellRight,
				bottom: that.cellBottom
			};
			
			that.realTableRange = {
				left: that.cellLeft,
				top: that.cellTop,
				right: that.cellRight,
				bottom: that.cellBottom
			};
			
			var isLeftOffset = true;
			var isRightOffset = true;
			var isTopOffset = true;
			var isBottomOffset = true;
			
			if( typeof( that.previousTableRange ) !== 'undefined' ){
				if( (that.cellTop - that.previousTableRange.top) > 0 ){
					merged.top = that.previousTableRange.bottom < offsetTopCells ? merged.top : that.previousTableRange.bottom ;
				} else if( (that.cellTop - that.previousTableRange.top) < 0 ){
					merged.bottom = that.previousTableRange.top > offsetTopCells ? merged.bottom : that.previousTableRange.top;
				} else {
					isTopOffset = false;
				}
				
				if( (that.cellBottom - that.previousTableRange.bottom) > 0 ){
					merged.top = (merged.bottom - cellsHeight) > that.previousTableRange.bottom ? merged.top : that.previousTableRange.bottom;
					if( merged.top === merged.bottom){
						isBottomOffset = false;
					}
					
				} else if( (that.cellTop - that.previousTableRange.top) < 0 ){
					//merged.bottom = that.previousTableRange.top < ( offsetTopCells+cellsHeight) ? merged.bottom : that.previousTableRange.top;
				} else {
					isBottomOffset = false;
				}
				
				if( (that.cellLeft - that.previousTableRange.left) > 0 ){
					merged.left = that.previousTableRange.right < offsetLeftCells ? merged.left : that.previousTableRange.right;
				} else if( (that.cellLeft - that.previousTableRange.left) < 0 ){
					merged.right = that.previousTableRange.left > offsetLeftCells ? merged.right : that.previousTableRange.left;
				} else {
					isLeftOffset = false;
				}
				
				if( (that.cellRight - that.previousTableRange.right) > 0 ){
					merged.left = (merged.right - cellsWidth) > that.previousTableRange.right ? merged.left : that.previousTableRange.right;
					if( merged.left === merged.right){
						isRightOffset = false;
					}
				} else if( (that.cellRight - that.previousTableRange.right) < 0 ){
					//merged.right = that.previousTableRange.left < ( offsetLeftCells+cellsWidth ) ? merged.right : that.previousTableRange.left;
				} else {
					isRightOffset = false;
				}
				
				
			} else {
				merged = {
					left: that.cellLeft,
					top: that.cellTop,
					right: that.cellRight,
					bottom: that.cellBottom
				};
			}
			
			that.needRebuild = isTopOffset || isLeftOffset || isBottomOffset || isRightOffset;
			
			that.previousTableRange = {
				left: that.cellLeft,
				top: that.cellTop,
				right: that.cellRight,
				bottom: that.cellBottom
			};
			
			that.tableCellRange = merged;
			that.tableServerCellRange = [];
			that.tableServerCellRange.length = 0;
			that.tableServerCellRange.push(that.tableCellRange);
			
			
			var fixedColumnsRange = {};
			that.displayedFixedColumns = [];
			that.displayedFixedColumns.length = 0;
			for( var fixedColIndex in that.fixedColumns ){
				if( fixedColIndex < that.realTableRange.right ){
					that.displayedFixedColumns[fixedColIndex] = that.fixedColumns[fixedColIndex];
				}
			}
			
			var fixedRowsRange = {};
			that.displayedFixedRows = [];
			that.displayedFixedRows.length = 0;
			for( var fixedRowIndex in that.fixedRows ){
				if( fixedRowIndex < that.realTableRange.bottom ){
					that.displayedFixedRows[fixedRowIndex] = that.fixedRows[fixedRowIndex];
				}
			}
			that.determinateUnions();
		};
		
		this.addUnionToTableRange = function(){
			var j = 0;
			var i = 0;
			for( j = 0; j < that.cellsUnions.union.length; j++ ){
				i = that.cellsUnions.union[j];
				if( typeof(that.cellsUnions.displayedRanges[i]) !== 'undefined' ){
					if( !$('#r'+that.meta.cellSpanList[i].top+'c'+that.meta.cellSpanList[i].left+'-'+that.tableIdSalt).length ){
						that.tableServerCellRange.push({
							left: that.meta.cellSpanList[i].left,
							right: that.meta.cellSpanList[i].left,
							top: that.meta.cellSpanList[i].top,
							bottom: that.meta.cellSpanList[i].top
						});
					}
				}
			}
		};
		
		this.determinateUnions = function(){
			that.cellsUnions.displayedRanges = [];
			for( var i = 0; i < that.meta.cellSpanList.length; i++ ){
				that.cellsUnions.displayedRanges[i] = {
					top: that.meta.cellSpanList[i].top,
					bottom: that.meta.cellSpanList[i].bottom,
					left: that.meta.cellSpanList[i].left,
					right: that.meta.cellSpanList[i].right
				};
				if( that.cellsUnions.displayedRanges[i].left < that.realTableRange.left ){
					that.cellsUnions.displayedRanges[i].left = that.realTableRange.left;
					if( that.cellsUnions.displayedRanges[i].right < that.realTableRange.left){
						that.cellsUnions.displayedRanges.splice(i,1);
						continue;
					} else if( that.cellsUnions.displayedRanges[i].right > that.realTableRange.right ){
						that.cellsUnions.displayedRanges[i].right = that.realTableRange.right;
					}
				}
				if( that.cellsUnions.displayedRanges[i].right > that.realTableRange.right ){
					that.cellsUnions.displayedRanges[i].right = that.realTableRange.right;
					if( that.cellsUnions.displayedRanges[i].left > that.realTableRange.right){
						that.cellsUnions.displayedRanges.splice(i,1);
						continue;
					} else if( that.cellsUnions.displayedRanges[i].left < that.realTableRange.left ){
						that.cellsUnions.displayedRanges[i].left = that.realTableRange.left;
					}
				}
				if( that.cellsUnions.displayedRanges[i].top < that.realTableRange.top ){
					that.cellsUnions.displayedRanges[i].top = that.realTableRange.top;
					if( that.cellsUnions.displayedRanges[i].bottom < that.realTableRange.top){
						that.cellsUnions.displayedRanges.splice(i,1);
						continue;
					} else if( that.cellsUnions.displayedRanges[i].bottom > that.realTableRange.bottom ){
						that.cellsUnions.displayedRanges[i].bottom = that.realTableRange.bottom;
					}
				}
				if( that.cellsUnions.displayedRanges[i].bottom > that.realTableRange.bottom ){
					that.cellsUnions.displayedRanges[i].bottom = that.realTableRange.bottom;
					if( that.cellsUnions.displayedRanges[i].top > that.realTableRange.bottom){
						that.cellsUnions.displayedRanges.splice(i,1);
						continue;
					} else if( that.cellsUnions.displayedRanges[i].top < that.realTableRange.top ){
						that.cellsUnions.displayedRanges[i].top = that.realTableRange.top;
					}
				}
			}
		};
		
		this.determinateMergedUnions = function(){
			that.cellsUnions.merged = [];
			that.cellsUnions.union = [];
			var single = true;
			for( i = 0; i < that.meta.cellSpanList.length ; i++ ){
				$.grep( that.meta.cellSpanList, function(item, index){
					var mergedIndex = -1;
					if( index >= i ){
						return;
					}
					if( 
						that.meta.cellSpanList[i].left === item.left && 
						( 	
							that.meta.cellSpanList[i].top >= item.top && 
							that.meta.cellSpanList[i].top <= item.bottom 
						)
					){
						mergedIndex = i;
					}
					if( 
						that.meta.cellSpanList[i].right === item.right && 
						( 	
							that.meta.cellSpanList[i].top >= item.top && 
							that.meta.cellSpanList[i].top <= item.bottom 
						)
					){
						mergedIndex = i;
					}
					if( 
						that.meta.cellSpanList[i].top === item.top && 
						( 	
							that.meta.cellSpanList[i].left >= item.left && 
							that.meta.cellSpanList[i].left <= item.right 
						)
					){
						mergedIndex = i;
					}
					if( 
						that.meta.cellSpanList[i].right === item.right && 
						( 	
							that.meta.cellSpanList[i].left >= item.left && 
							that.meta.cellSpanList[i].left <= item.right 
						)
					){
						mergedIndex = i;
					}
					if( mergedIndex !== -1 ){
						single = false;
						if( that.cellsUnions.merged.indexOf(i) === -1 ){
							that.cellsUnions.merged.push(i);
						}
						if( that.cellsUnions.merged.indexOf(index) === -1 ){
							that.cellsUnions.merged.push(index);
						}
					}
				});
				if( single ){
					if( that.cellsUnions.union.indexOf(i) === -1 ){
						that.cellsUnions.union.push(i);
					}
				}
				single = true;
			}
		};
		
		this.disableMergedUnions = function(){
			var cellId = '';
			var disabledCells = [];
			for(var j = 0; j < that.cellsUnions.merged.length ; j++){
				var i = that.cellsUnions.merged[j];
				if( typeof(that.cellsUnions.displayedRanges[i]) !== 'undefined' ){
					for( var rowIndex = that.cellsUnions.displayedRanges[i].top; rowIndex <= that.cellsUnions.displayedRanges[i].bottom; rowIndex++ ){
						for( var colIndex = that.cellsUnions.displayedRanges[i].left; colIndex <= that.cellsUnions.displayedRanges[i].right; colIndex++ ){
							cellId = '#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt;
							element = $(cellId).find('.cell-inner');
							element.html('');
							element.removeClass('cell-inner');
							element.addClass('cell-disabled');
							((disabledCells=disabledCells||[])[rowIndex]=disabledCells[rowIndex]||[])[colIndex]=true;
						}
					}
				}
			}
			
			$('#lazyTable-'+that.tableIdSalt+' .cell-disabled').removeClass('cell-disabled-bottom');
			$('#lazyTable-'+that.tableIdSalt+' .cell-disabled').removeClass('cell-disabled-right');
			$.each(disabledCells, function(rowIndex, row){
				$.each(row, function(colIndex, item){
					element = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).find('.cell-disabled');
					if( (disabledCells[parseInt(rowIndex)+1]=disabledCells[parseInt(rowIndex)+1]||{})[parseInt(colIndex)] !== true ) {
						element.addClass('cell-disabled-bottom');
					}
					if( (disabledCells[parseInt(rowIndex)]=disabledCells[parseInt(rowIndex)]||{})[parseInt(colIndex)+1] !== true ) {
						element.addClass('cell-disabled-right');
					}
				});
			});
		};
		
		this.expandUnionCells = function(){
			var height = 0;
			var width = 0;
			var offsetTop = 0;
			var offsetLeft = 0;
			var cellStr = '';
			var tableId = 'lazyTable-'+that.tableIdSalt;
			
			var rowIndex = 0;
			var colIndex = 0;
			for( var j = 0; j < that.cellsUnions.union.length; j++ ){
				var i = that.cellsUnions.union[j];
				if( typeof(that.cellsUnions.displayedRanges[i]) !== 'undefined' ){
					that.cellsUnions.displayedRanges[i] = {
						top: that.meta.cellSpanList[i].top,
						bottom: that.meta.cellSpanList[i].bottom,
						left: that.meta.cellSpanList[i].left,
						right: that.meta.cellSpanList[i].right
					};
					for( rowIndex = that.cellsUnions.displayedRanges[i].top; rowIndex <= that.cellsUnions.displayedRanges[i].bottom; rowIndex++ ){
						height += typeof(that.realRows[rowIndex]) !== 'undefined'? 
								that.realRows[rowIndex].height : that.meta.defaultRow.height; 
					}
					for( colIndex = that.cellsUnions.displayedRanges[i].left; colIndex <= that.cellsUnions.displayedRanges[i].right; colIndex++ ){
						width += typeof(that.realColumns[colIndex]) !== 'undefined'? 
								that.realColumns[colIndex].width : that.meta.defaultColumn.width; 
					}
					for( rowIndex = that.cellsUnions.displayedRanges[i].top; rowIndex <= that.cellsUnions.displayedRanges[i].bottom; rowIndex++ ){
						for( colIndex = that.cellsUnions.displayedRanges[i].left; colIndex <= that.cellsUnions.displayedRanges[i].right; colIndex++ ){
							element = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt);
							if( 
								rowIndex === that.cellsUnions.displayedRanges[i].top && 
								colIndex === that.cellsUnions.displayedRanges[i].left 
							){
								if( element.length ){
									if( !element.hasClass('cell-union') ){
										element.addClass('cell-union');
										element.find('.cell-inner').addClass('cell-union');
										element.css('z-index', '4');
										if( !element.data('unionid') ){
											element.data('unionid',i);
											element.find('.cell-inner').data('unionid',i);
										}
									}
								} else {
									for( i2 = 0; i2 < rowIndex; i2++ ){
										offsetTop += typeof(that.realRows[i2]) !== 'undefined'? that.realRows[i2].height : that.meta.defaultRow.height;
									}
									for( i2 = 0; i2 < colIndex; i2++ ){
										offsetLeft += typeof(that.realColumns[i2]) !== 'undefined'? that.realColumns[i2].width : that.meta.defaultColumn.width;
									}
									cellStr = '<div id="r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt +'"' + ' class="cell-union cell r'+rowIndex+' c'+colIndex+'"' + ' data-row="'+rowIndex+'"' +
									' data-col="'+colIndex+'"' + ' data-unionid="' + i + '" style="top:'+offsetTop+'px;left:'+offsetLeft+'px;z-index:4;">'+
								
									'<div class="cell-union cell-inner" data-row="'+rowIndex+'"' +
									' data-col="'+colIndex+'"' + ' data-unionid="' + i + '"></div>'+
									'</div>';
									document.getElementById(tableId).insertAdjacentHTML('beforeend', cellStr);
								}
								
								continue;
							} else {
								element.addClass('passive-union-part');
							}
							if( element.length ){
								if( !element.data('unionid') ){
									element.data('unionid',i);
									element.find('.cell-inner').data('unionid',i);
								}
							}
						}
					}
					$('#r'+that.cellsUnions.displayedRanges[i].top+'c'+that.cellsUnions.displayedRanges[i].left+'-'+that.tableIdSalt).css({
						'height': height,
						'width': width
					});
					$('#r'+that.cellsUnions.displayedRanges[i].top+'c'+that.cellsUnions.displayedRanges[i].left+'-'+that.tableIdSalt+' .cell-inner').css({
						'height': height,
						'width': width
					});
					height = 0;
					width = 0;
				}
				offsetTop = 0;
				offsetLeft = 0;
			}
		};
		
		this.getUnionId = function(fixedRowIndex, fixedColIndex){
			for( var i = 0; i < that.meta.cellSpanList.length; i++ ){
				if( 
					fixedRowIndex >= that.meta.cellSpanList[i].top &&
					fixedRowIndex <= that.meta.cellSpanList[i].bottom && 
					fixedColIndex >= that.meta.cellSpanList[i].left &&
					fixedColIndex <= that.meta.cellSpanList[i].right 
				){
					return i;
				}
			}
			return -1;
		};
		
		this.createSpinner = function(){
			$('<div class="spinner" id="spinner-' + that.tableIdSalt + '"></div>').appendTo(that.element);
		};
		
		this.animateSpinner = function(){
			/*$('#spinner-' + that.tableIdSalt).animate({
				'left' : '-100%'
			}, 7000, 'swing',function(){
				$('#spinner-' + that.tableIdSalt).css('left', '0');
				that.animateSpinner();
			});*/
		};
		
		this.hideSpinner = function(){
			$('#spinner-' + that.tableIdSalt).hide();
			$('#spinner-' + that.tableIdSalt).stop();
		};
		
		this.showSpinner = function(){
			$('#spinner-' + that.tableIdSalt).show();
			that.animateSpinner();
		};
		
		this.parseDate = function(input, format) {
			format = format || 'yyyy-mm-dd'; // default format
			var parts = input.match(/(\d+)/g), 
			i = 0, fmt = {};
			// extract date-part indexes from the format
			format.replace(/(yyyy|dd|mm)/g, function(part) { fmt[part] = i++; });
			return new Date(parts[fmt['yyyy']], parts[fmt['mm']]-1, parts[fmt['dd']]);
		};
		
		this.buildSelectArea = function(isStatic){
			if( that.selectArea.startCell.row !== -1 ){
				if(isStatic){
					that.drawStaticSelectArea();
				} else {
					that.drawDynamicSelectArea();
				}
			}
		};
		
		this.drawDynamicSelectArea = function(){
			if( $('.cell-edit').length ){
				return;
			}
			var selectStr = '';
			if( $('#lazy-table-select-'+that.tableIdSalt).length ){
				$('#lazy-table-select-'+that.tableIdSalt).remove();
			}
			if( that.selectArea.cellPosition.left > that.selectArea.cellPosition.right ){
				that.selectArea.cellPosition.left = that.selectArea.cellPosition.right + (that.selectArea.cellPosition.right=that.selectArea.cellPosition.left, 0);
			}
			if( that.selectArea.cellPosition.top > that.selectArea.cellPosition.bottom ){
				that.selectArea.cellPosition.top = that.selectArea.cellPosition.bottom + (that.selectArea.cellPosition.bottom=that.selectArea.cellPosition.top, 0);
			}
			var left = that.selectArea.cellPosition.left < that.realTableRange.left ? 
				that.realTableRange.left : 
				that.selectArea.cellPosition.left > that.realTableRange.right ?
					-1 : 
					that.selectArea.cellPosition.left;
			var top = that.selectArea.cellPosition.top < that.realTableRange.top ? 
				that.realTableRange.top : 
				that.selectArea.cellPosition.top > that.realTableRange.bottom ?
					-1 : 
					that.selectArea.cellPosition.top;
			var right = that.selectArea.cellPosition.right > that.realTableRange.right ?
				that.realTableRange.right :
				that.selectArea.cellPosition.right < that.realTableRange.left?
					-1 :
					that.selectArea.cellPosition.right;
			var bottom = that.selectArea.cellPosition.bottom > that.realTableRange.bottom ?
				that.realTableRange.bottom :
				that.selectArea.cellPosition.bottom < that.realTableRange.top?
					-1 :
					that.selectArea.cellPosition.bottom;
			if( left !== -1 && top !== -1 && right !== -1 && bottom !== -1 ){
				if( 
					$('#r'+top+'c'+left+'-'+that.tableIdSalt).length && 
					$('#r'+bottom+'c'+right+'-'+that.tableIdSalt).length 
				){
					that.deleteDynamicSelectedCells();
					for( i = top; i <= bottom; i++ ){
						for( j = left; j <= right; j++ ){
							if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).find('.cell-disabled').length ){
								unionId = $('#r'+i+'c'+j+'-'+that.tableIdSalt).data('unionid');
								if( typeof(unionId) === 'undefined' ){
									if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') ){
										$('#r'+i+'c'+j+'-'+that.tableIdSalt).addClass('cell-selected-dynamic-layer');
									}
									$('#r'+i+'c'+j+'-'+that.tableIdSalt).addClass('cell-selected-dynamic');
									(that.selectedCellsHelper[i]=that.selectedCellsHelper[i]||{})[j] = true;
									if( that.data.length !== 0 ){
										if( that.selectedCells.indexOf(that.data[i][j]) == -1 ){
											that.selectedCells.push(that.data[i][j]);
										}
									}
								} else {
									element = $('#r'+that.meta.cellSpanList[unionId].top+'c'+that.meta.cellSpanList[unionId].left+'-'+that.tableIdSalt);
									if( !element.hasClass('cell-selected') ){
										element.addClass('cell-selected-dynamic-layer');
									}
									element.addClass('cell-selected-dynamic');
									(that.selectedCellsHelper[that.meta.cellSpanList[unionId].top]=that.selectedCellsHelper[that.meta.cellSpanList[unionId].top]||{})[that.meta.cellSpanList[unionId].left] = true;
									if( that.data.length !== 0 ){
										if( that.selectedCells.indexOf(that.data[that.meta.cellSpanList[unionId].top][that.meta.cellSpanList[unionId].left]) == -1 ){
											that.selectedCells.push(that.data[that.meta.cellSpanList[unionId].top][that.meta.cellSpanList[unionId].left]);
										}
									}
								}
							}
						}
					}
					
				}
			}
		};
		
		this.drawStaticSelectArea = function(){
			$('.cell-selected-dynamic').removeClass('cell-selected-dynamic-layer');
			$('.cell-selected-dynamic').removeClass('cell-selected-dynamic');
			$('.cell-selected').removeClass('cell-selected-bottom');
			$('.cell-selected').removeClass('cell-selected-left');
			$('.cell-selected').removeClass('cell-selected-right');
			$('.cell-selected').removeClass('cell-selected-top');
			$('.cell-inner').removeClass('cell-selected-bottom');
			$('.cell-inner').removeClass('cell-selected-left');
			$('.cell-inner').removeClass('cell-selected-right');
			$('.cell-inner').removeClass('cell-selected-top');
			var selectedUnionsCell = [];
			$.each(that.selectArea.staticCells, function(rowIndex, row){
				$.each(row, function(colIndex, item){
					element = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt);
					element.addClass('cell-selected');
					if( !element.hasClass('cell-union') ){
						if( (that.selectArea.staticCells[parseInt(rowIndex)-1]=that.selectArea.staticCells[parseInt(rowIndex)-1]||{})[parseInt(colIndex)] !== true ) {
							$('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).addClass('cell-selected-top');
						}
						if( (that.selectArea.staticCells[parseInt(rowIndex)+1]=that.selectArea.staticCells[parseInt(rowIndex)+1]||{})[parseInt(colIndex)] !== true ) {
							$('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).addClass('cell-selected-bottom');
						}
						if( (that.selectArea.staticCells[parseInt(rowIndex)]=that.selectArea.staticCells[parseInt(rowIndex)]||{})[parseInt(colIndex)-1] !== true ) {
							$('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).addClass('cell-selected-left');
						}
						if( (that.selectArea.staticCells[parseInt(rowIndex)]=that.selectArea.staticCells[parseInt(rowIndex)]||{})[parseInt(colIndex)+1] !== true ) {
							$('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).addClass('cell-selected-right');
						}
					} else {
						unionId = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).data('unionid');
						selectedUnionsCell.push(unionId);
					}
				});
			});
			
			for( var q = 0; q < selectedUnionsCell.length; q++ ){
				unionId = selectedUnionsCell[q];
				var i;
				var j;
				//top border
				i = that.meta.cellSpanList[unionId].top - 1;
				if( i !== -1){
					for( j = that.meta.cellSpanList[unionId].left; j <= that.meta.cellSpanList[unionId].right; j++ ){
						if( 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') && 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected-bottom')
						){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).removeClass('cell-selected-bottom');
						} else if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') ){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt+' .cell-inner').addClass('cell-selected-bottom');
						}
					}
				}
				//bottom border
				i = that.meta.cellSpanList[unionId].bottom + 1;
				if( i <= that.meta.rowCount ){
					for( j = that.meta.cellSpanList[unionId].left; j <= that.meta.cellSpanList[unionId].right; j++ ){
						if( 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') && 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected-top')
						){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).removeClass('cell-selected-top');
						} else if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected')){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt+' .cell-inner').addClass('cell-selected-top');
						}
					}
				}
				//left border
				j = that.meta.cellSpanList[unionId].left - 1;
				if( j !== -1 ){
					for( i = that.meta.cellSpanList[unionId].top; i <= that.meta.cellSpanList[unionId].bottom; i++ ){
						if( 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') && 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected-right')
						){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).removeClass('cell-selected-right');
						} else if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected')){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt+' .cell-inner').addClass('cell-selected-right');
						}
					}
				}
				
				//left border
				j = that.meta.cellSpanList[unionId].right + 1;
				if( j <= that.meta.colCount ){
					for( i = that.meta.cellSpanList[unionId].top; i <= that.meta.cellSpanList[unionId].bottom; i++ ){
						if( 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') && 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected-left')
						){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).removeClass('cell-selected-left');
						} else if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected')){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt+' .cell-inner').addClass('cell-selected-left');
						}
					}
				}
			}
		};
		
		this.deleteSelectedArea = function(){
			that.selectedCells = [];
			that.selectedCells.length = 0;
			that.selectArea.cellPosition = [];
			that.selectArea.cellPosition.length = 0;
			
		};
		
		this.deleteStaticSelectedCells = function(){
			that.selectArea.staticCells = {};
			that.deleteSelectedArea();
			$(that.tableWrapper).find('.cell-selected').removeClass('cell-selected-top cell-selected-bottom cell-selected-left cell-selected-right cell-selected');
		};
		
		this.deleteDynamicSelectedCells = function(){
			that.selectedCellsHelper = {};
			$(that.tableWrapper).find('.cell-selected-dynamic').removeClass('cell-selected-dynamic-layer');
			$(that.tableWrapper).find('.cell-selected-dynamic').removeClass('cell-selected-dynamic');
		};
		
		this.mergeSelectArea = function(){
			$.each(that.selectedCellsHelper, function(rowIndex, row){
				$.each(row, function(colIndex, item){
					
					if( (that.selectArea.staticCells[rowIndex]=that.selectArea.staticCells[rowIndex]||{})[colIndex] !== true ){
						that.selectArea.staticCells[rowIndex][colIndex] = true;
					}
				});
			});
		};
		
		this.updateTableCellList = function(tableCellList){
			$.each(tableCellList, function(key, tableCellItem){
				if (!(that.data[tableCellItem.rowIndex] && that.data[tableCellItem.rowIndex][tableCellItem.colIndex])){
					return;
				}
				var cellId = getLgCellId(tableCellItem,that);
				var cellElement = $(cellId);
				if( cellElement.hasClass('cell-under-edit')){
					return;
				}
				$.each($(cellId).find('.cell-filled'), function(key,value){
					$(value).removeClass('cell-filled');
				});
				that.createCellContent(tableCellItem);
			});
			//that.serverEvent('onValueChange', tableCellList);
		};
		
		this.fixCellHeight = function(){
			$('#lazyTable-'+that.tableIdSalt+'-wrapper .cell').each(function(key, item){
				var rowIndex = $(item).data('row');
				var colIndex = $(item).data('col');
				var rowHeight = typeof(that.realRows[rowIndex]) !== 'undefined'? that.realRows[rowIndex].height : that.meta.defaultRow.height;
				if( rowHeight < $(item).height() ){
					//var element = getLgElementUnder(rowIndex, colIndex, that); 
					//element.css('z-index', '1');
					$(item).find('.cell-inner').css('line-height', (rowHeight-4)+'px');
				}
			});
		};
		
		this.loadCellMenu = function(menuItemList){
			var menuElement = lgContextMenu;
			menuElement.empty();
			menuElement.off("menuselect");
			menuElement.on( "menuselect", function( event, ui ) {
				$(this).hide();
				var menuItem = event.originalEvent.currentTarget.menuItem;
				var tableCell = event.target.tableCell;
				var menuItemContext = {
					targetCell: tableCell,
					selectedCellList: that.selectedCells,
					selectedMenuItem: menuItem
				};
				that.initialData.onMenuItemSelect(menuItemContext);
			} );
			
			$.each(menuItemList, function(key, menuItem){
				var menuItemElement = $('<li><a href="#">' + menuItem.menuItemName + '</a></li>');
				menuItemElement.appendTo(menuElement);
//				menuItemElement.menuItem = menuItem;
				menuItemElement.each(function(){
					this.menuItem = menuItem;
				});
			});
			lgContextMenu.menu( "refresh" );
			lgContextMenu.show();
		};
		
		this.hurtMe = function(){
			that.hideSpinner();
			$('#lazyTable-'+that.tableIdSalt).remove();
			$(that.tableWrapper).html('Размер таблицы превышает возможности браузера');
		};

		this.fillTable = function(cellsData){
			var isDataSet = false;
			that.timer = {};
			that.timerServerOnSelect = {};
			that.timerTime = 0;
			that.tooltipPosition = '';
			
			that.ctrlPressed = false;
			that.shiftPressed = false;
			
			that.leftMouse = 0;
			that.rightMouse = 2;
			
			$.each(cellsData, function(key, cell){
				that.createCellContent(cell);
			});
			$('#lazyTable-'+that.tableIdSalt+'-wrapper .cell:not(.passive-union-part) .cell-inner:not(.cell-filled)').each(function(key, item){
				var rowIndex = $(item).data('row');
				var colIndex = $(item).data('col');
				isDataSet = isCellDataSet(rowIndex, colIndex, that);
				if( isDataSet ){
					that.createCellContent(that.data[rowIndex][colIndex]);
				}				
			});
			
			that.fixCellHeight();
			
			that.buildSelectArea(true);
			
			if (that.useActiveCell){
				that.useActiveCell = false;
				var cellElement = getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);
				var rowIndex = cellElement.data('row');
				var colIndex = cellElement.data('col');
				isDataSet = isCellDataSet(rowIndex, colIndex, that);
				if( isDataSet ){
					if( !isLgCellEditable(that.data[rowIndex][colIndex]) ){
						if ( that.tabDirection === 'forward' ){
							that.getNextEditableCell();
						} else {
							that.getPreviousEditableCell();
						}
					} else {
						cellElement = cellElement.find('.cell-inner');
						that.startCellEdit(cellElement);					
					}
				} else {
					if ( that.tabDirection === 'forward' ){
						that.getNextEditableCell();
					} else {
						that.getPreviousEditableCell();
					}
				}
			}
			
			that.hideSpinner();
			that.isDrawing = false;
			that.stopTab = false;
		};
		
		this.getNextEditableCell = function(){
			that.tabDirection = 'forward';
			var cellElement = {};
			if( that.currentActiveCell.col < ( that.meta.colCount - 1) ){
				that.currentActiveCell.col += 1;
				cellElement =  getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);				
			} else if( that.currentActiveCell.row < (that.meta.rowCount - 1) ){
				that.currentActiveCell.row += 1;
				that.currentActiveCell.col = 0;
				cellElement = getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);
			} else {
				that.serverEvent('onMoveNextTable', []);
				$('.cell-edit').trigger( "blur" );
				return;
			}
			if( !cellElement.length ){
				var elementHeight = typeof(that.realRows[that.currentActiveCell.row]) !== 'undefined'? 
						- that.realRows[that.currentActiveCell.row].height : - that.meta.defaultRow.height;
				that.moveTableToLeftBegin(elementHeight);
				that.useActiveCell = true;
				return;
			}
			var rowIndex = cellElement.data('row');
			var colIndex = cellElement.data('col');
			
			var visibleFramePositionRight = Math.abs($('#lazyTable-'+that.tableIdSalt).position().left) + $(that.tableWrapper).width();
			var elementPositionRight = Math.abs($(cellElement).position().left)+$(cellElement).width();
			if ( visibleFramePositionRight < elementPositionRight ){
				var fixedColumnWidth = 0;
				for( var fixedColIndex in that.displayedFixedColumns ){
					if( typeof(that.displayedFixedColumns[fixedColIndex]) === 'object' ){
						if( fixedColIndex < rowIndex ){
							fixedColumnWidth += typeof(that.realColumns[fixedColIndex]) !== 'undefined'? 
								that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
						}
					}
				}
				$(that.tableWrapper).scrollLeft(Math.abs($(cellElement).position().left) - fixedColumnWidth);
				that.useActiveCell = true;
				return;
			}
			if( cellElement.find('.cell-disabled').length ){
				that.getNextEditableCell();
			}
			var isDataSet = isCellDataSet(rowIndex, colIndex, that);
			if( isDataSet ){
				if( isLgCellEditable(that.data[rowIndex][colIndex]) ){
					cellElement = cellElement.find('.cell-inner');
					that.startCellEdit(cellElement);
				} else {
					that.getNextEditableCell();
				}
			} else {
				that.canMoveNextEdit = true;
			}
		};

		
		
		this.getPreviousEditableCell = function(){
			that.tabDirection = 'back';
			var cellElement = {};
			if( that.currentActiveCell.col != 0 ){
				that.currentActiveCell.col -= 1;
				cellElement = getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);
			} else if( that.currentActiveCell.row != 0 ){
				that.currentActiveCell.row -= 1;
				that.currentActiveCell.col = that.meta.colCount - 1;
				cellElement = getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);
			} else {
				that.serverEvent('onMovePrevTable', []);
				$('.cell-edit').trigger( "blur" );
				return;
			}
			if( !cellElement.length ){
				var elementHeight = typeof(that.realRows[that.currentActiveCell.row]) !== 'undefined'? 
						that.realRows[that.currentActiveCell.row].height : that.meta.defaultRow.height;
				
				if( that.currentActiveCell.col == ( that.meta.colCount - 1) ){
					that.moveTableToRightEnd(elementHeight);
				} else {
					var tableLeftBorder = Math.abs($('#lazyTable-'+that.tableIdSalt).position().left);
					that.tableWrapper.scrollLeft(tableLeftBorder - that.tableWrapper.width() + 50);
				}				
				
				that.useActiveCell = true;
				return;
			}
			var rowIndex = cellElement.data('row');
			var colIndex = cellElement.data('col');

			var visibleFramePositionLeft = Math.abs($('#lazyTable-'+that.tableIdSalt).position().left);
			var elementPositionLeft = Math.abs($(cellElement).position().left);
			var fixedColumnWidth = $(that.tableWrapper).find('.lazy-table-fixed-column-container').width();
			if ( fixedColumnWidth && fixedColumnWidth > elementPositionLeft - visibleFramePositionLeft ){
				that.tableWrapper.scrollLeft(visibleFramePositionLeft - $(cellElement).width());
			}
			
			visibleFramePositionLeft = Math.abs($('#lazyTable-'+that.tableIdSalt).position().left);
			elementPositionLeft = Math.abs($(cellElement).position().left);
			if ( visibleFramePositionLeft > elementPositionLeft ){
				/*var fixedColumnWidth = 0;
				for( fixedColIndex in that.displayedFixedColumns ){
					if( typeof(that.displayedFixedColumns[fixedColIndex]) === 'object' ){
						if( fixedColIndex < rowIndex ){
							fixedColumnWidth += typeof(that.realColumns[fixedColIndex]) !== 'undefined'? 
								that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
						}
					}
				}*/
				$(that.tableWrapper).scrollLeft(elementPositionLeft);
				that.useActiveCell = true;
				return;
			}

			/*var visibleFramePositionTop = Math.abs($('#lazyTable-'+that.tableIdSalt).position().top);
			var elementPositionTop = Math.abs($(cellElement).position().top);
			var fixedColumnHeight = $('.lazy-table-fixed-row-container').height();
			if ( fixedColumnHeight && fixedColumnHeight > elementPositionTop - visibleFramePositionTop ){
				that.tableWrapper.scrollTop(visibleFramePositionTop - $(cellElement).height());
			}*/
			if( cellElement.find('.cell-disabled').length ){
				that.getPreviousEditableCell();
			}
			var isDataSet = isCellDataSet(rowIndex, colIndex, that);
			if( isDataSet ){
				if( isLgCellEditable(that.data[rowIndex][colIndex]) ){
					cellElement = cellElement.find('.cell-inner');
					that.startCellEdit(cellElement);
				} else {
					that.getPreviousEditableCell();
				}
			} else {
				that.canMoveNextEdit = true;
			}
		};
		
		
		
		this.addEventListeners = function (){
			$(document).bind('keydown', function (event) {
				switch (event.keyCode) {
					case 17: // Ctrl
						that.ctrlPressed = true;
						break;
					case 16: // Shift
						that.shiftPressed = true;
						break;
					default:
						break;
				}
			});
			$(document).bind('keyup', function (event) {
				switch (event.keyCode) {
					case 17: // Ctrl
						that.ctrlPressed = false;
						break;
					case 16: // Shift
						that.shiftPressed = false;
						break;
					default:
						break;
				}
			});
			
			var tazyTableElement = document.getElementById('lazyTable-'+that.tableIdSalt);
			
			$(tazyTableElement).on('keyup', function(event){
				switch (event.keyCode) {
					case 9: // Tab
						that.isTabPressed = false;
						break;
					default:
						break;				
				}				
			});
			
			$(document).on('keydown', function(event){
				switch (event.keyCode) {
					case 9: // Tab
						if( that.stopTab ){
							event.preventDefault();
						}
					break;
					default:
					break;
				}
			});
			
			$(tazyTableElement).on('keydown', function(event){
				
					switch (event.keyCode) {
						case 9: // Tab
							event.preventDefault();
							if( !that.stopTab && that.canMoveNextEdit && !that.isTabPressed ){
								that.isTabPressed = true;
								that.canMoveNextEdit = false;
								if( event.shiftKey ){
									that.getPreviousEditableCell();
								}else {
									that.getNextEditableCell();
								}
							}
							break;
						default:
							break;
					}
			});
			
			tazyTableElement.onclick = function(e){
				that.time1 = new Date();
				e = e || window.event;
				target = e.target || e.srcElement;
				var x = e.clientX, y = e.clientY,
				elementMouseIsOver = document.elementFromPoint(x, y);
				cellElement = getLgCellElement($(elementMouseIsOver));
				if( cellElement.hasClass('lazy-table-select') ){
					cellElement.hide();
					x = e.clientX, y = e.clientY,
					elementMouseIsOver = document.elementFromPoint(x, y);
					cellElement = getLgCellElement($(elementMouseIsOver));
				}
				if( !cellElement.find('.cell-edit').length && !cellElement.hasClass('cell-edit') && !cellElement.hasClass('cell-disabled') && !cellElement.hasClass('cell-under-edit') && (!that.ctrlPressed && !that.shiftPressed )){
					var rowIndex = cellElement.data('row');
					var colIndex = cellElement.data('col');
					if( cellElement.hasClass('cell-union') ){
						cellElement.parent().hide();
						x = e.clientX, y = e.clientY,
						elementMouseIsOver = document.elementFromPoint(x, y);
						cellElement.parent().show();
						unionPartCellElement = $(elementMouseIsOver);
						if( unionPartCellElement.hasClass('cell-inner') ){
							rowIndex = unionPartCellElement.data('row');
							colIndex = unionPartCellElement.data('col');
						}
					}
					
					if( 
						that.selectArea.startCell.row === rowIndex && 
						that.selectArea.startCell.col === colIndex 
					){
						clearTimeout(that.timerServerOnSelect);
						that.startCellEdit(cellElement, e, true);
					}
				}
			};
			
			$(document).on('mouseup', function(e){
				if( typeof(e) === 'undefined' ){
					e = window.event;
					that.leftMouse = 1;
					that.rightMouse = 2;
				}
				if( e.button === that.leftMouse && that.mousedown ){
					that.mergeSelectArea();
					that.drawStaticSelectArea();
					that.isDrawing = false;
					clearTimeout(that.timerServerOnSelect);
					that.timerServerOnSelect = setTimeout(function(){
						that.serverEvent('onSelect', that.selectedCells);
					},500);
					that.mousedown = false;
				}	
			});
			
			tazyTableElement.onmousedown = function(e) {
				if( typeof(e) === 'undefined' ){
					e = window.event;
					that.leftMouse = 1;
					that.rightMouse = 2;
				}
				if( e.button === that.leftMouse ){
					target = e.target || e.srcElement;
					var x = e.clientX, y = e.clientY,
					elementMouseIsOver = document.elementFromPoint(x, y);
					cellElement = getLgCellElement($(elementMouseIsOver));
					if( cellElement.hasClass('lazyTable-tooltip') ){
						cellElement.hide();
						x = e.clientX, y = e.clientY,
						elementMouseIsOver = document.elementFromPoint(x, y);
						cellElement = $(elementMouseIsOver);
						$('#lazyTable-'+that.tableIdSalt+'-tooltip').show();
					}
					if( cellElement.hasClass('cell-union') ){
						oldCellElement = cellElement;
						cellElement.parent().hide();
						x = e.clientX, y = e.clientY,
						elementMouseIsOver = document.elementFromPoint(x, y);
						cellElement.parent().show();
						cellElement = $(elementMouseIsOver);
						if( !cellElement.hasClass('cell-inner') ){
							cellElement = oldCellElement;
						}
					}
					if( cellElement.hasClass('cell-inner') && !cellElement.hasClass('cell-under-edit') ){
						//if( !ctrlPressed && !shiftPressed ){
						
						if( !(that.ctrlPressed && that.selectArea.startCell.row !== -1) ){
							that.deleteStaticSelectedCells();
						}
						that.deleteDynamicSelectedCells();
						if( that.shiftPressed ){
							if( that.selectArea.lastCell.row === -1 ){
								that.selectArea.lastCell = {
									'col': cellElement.data('col'),
									'row': cellElement.data('row')
								};
							}
							that.selectArea.cellPosition.left = that.selectArea.lastCell.col;
							that.selectArea.cellPosition.top = that.selectArea.lastCell.row;
							that.selectArea.cellPosition.right = cellElement.data('col');
							that.selectArea.cellPosition.bottom = cellElement.data('row');
							that.selectArea.startCell.col = that.selectArea.lastCell.left;
							that.selectArea.startCell.row = that.selectArea.lastCell.top;
						} else {
							that.selectArea.cellPosition.left = cellElement.data('col');
							that.selectArea.cellPosition.top = cellElement.data('row');
							that.selectArea.cellPosition.right = cellElement.data('col');
							that.selectArea.cellPosition.bottom = cellElement.data('row');
							that.selectArea.startCell.col = that.selectArea.cellPosition.left;
							that.selectArea.startCell.row = that.selectArea.cellPosition.top;
						}
						
						if( that.ctrlPressed || that.shiftPressed ){
							that.buildSelectArea();
						}
						
						that.selectArea.lastCell = {
							'col': cellElement.data('col'),
							'row': cellElement.data('row')
						};
						e.preventDefault ? e.preventDefault() : (e.returnValue = false);
						that.mousedown = true;
						that.isDrawing = true;
					}
					if( !$(target).hasClass('cell-edit') ){
						$('.cell-edit').trigger( "blur" );
						return false;
					}
				}
				
			};
			
			tazyTableElement.onselectstart = function(e) { 
				e = e || window.event;
				target = e.target || e.srcElement;
				if( !$(target).hasClass('cell-edit') ){
					return false;
				}
			};
			
			tazyTableElement.onmousemove = function(e){
				e = e || window.event;
				var x = e.clientX, y = e.clientY,
				elementMouseIsOver = document.elementFromPoint(x, y);
				cellElement = getLgCellElement($(elementMouseIsOver));
				if( cellElement.hasClass('lazyTable-tooltip') ){
					cellElement.hide();
					x = e.clientX, y = e.clientY,
					elementMouseIsOver = document.elementFromPoint(x, y);
					cellElement = $(elementMouseIsOver);
					$('#lazyTable-'+that.tableIdSalt+'-tooltip').show();
				}
				if( that.mousedown ){
					if( cellElement.hasClass('cell-union') ){
						oldCellElement = cellElement;
						cellElement.parent().hide();
						x = e.clientX, y = e.clientY,
						elementMouseIsOver = document.elementFromPoint(x, y);
						cellElement.parent().show();
						cellElement = $(elementMouseIsOver);
						if( !cellElement.hasClass('cell-inner') ){
							cellElement = oldCellElement;
						}
					}
					var colIndex = cellElement.data('col');
					var rowIndex = cellElement.data('row');
					if( colIndex < that.selectArea.startCell.col ){
						if( colIndex !== that.selectArea.cellPosition.left ){
							that.selectArea.cellPosition.left = colIndex;
							that.buildSelectArea();
						}
					} else if( colIndex > that.selectArea.startCell.col ){
						if( colIndex !== that.selectArea.cellPosition.right ){
							that.selectArea.cellPosition.right = colIndex;
							that.buildSelectArea();
						}
					} else {
						if( that.selectArea.cellPosition.left !== that.selectArea.cellPosition.right ){
							that.selectArea.cellPosition.left = that.selectArea.startCell.col;
							that.selectArea.cellPosition.right = that.selectArea.startCell.col;
							that.buildSelectArea();
						}
					}
					
					if( rowIndex < that.selectArea.startCell.row ){
						if( rowIndex !== that.selectArea.cellPosition.top ){
							that.selectArea.cellPosition.top = rowIndex;
							that.buildSelectArea();
						}
					} else if( rowIndex > that.selectArea.startCell.row ){
						if( rowIndex !== that.selectArea.cellPosition.bottom ){
							that.selectArea.cellPosition.bottom = rowIndex;
							that.buildSelectArea();
						}
					} else {
						if( that.selectArea.cellPosition.top !== that.selectArea.cellPosition.bottom ){
							that.selectArea.cellPosition.top = that.selectArea.startCell.row;
							that.selectArea.cellPosition.bottom = that.selectArea.startCell.row;
							that.buildSelectArea();
						}
					}
					that.selectArea.lastCell = {
						row: rowIndex,
						col: colIndex
					};
				}
				
				
				if( !cellElement.hasClass('cell-inner') || cellElement.text() === ''  ){
					clearTimeout(that.timer);
					return;
				}
				/*var newTooltipPosition = ''+$(elementMouseIsOver).data('row')+$(elementMouseIsOver).data('col');
				if( tooltipPosition === newTooltipPosition ){
					return;
				}
				tooltipPosition = newTooltipPosition;*/
				//
				var cell = that.data[cellElement.data('row')][cellElement.data('col')];
				
				clearTimeout(that.timer);
				that.timer = setTimeout(function(){
					$('.lazyTable-tooltip').remove();
					var offset = $('#'+'lazyTable-'+that.tableIdSalt).offset();
					var tooltipElement = $('<div/>',{
						'id': 'lazyTable-'+that.tableIdSalt+'-tooltip',
						'class': 'lazyTable-tooltip',
						'css': {
							'top': y + 10,
							'left': x + 10
						} 
					});
					tooltipElement.html(cell.contentValue);
					tooltipElement.appendTo('html');
				}, 100);
			};
			
			tazyTableElement.onmouseleave = function(e){
				clearTimeout(that.timer);
				$('.lazyTable-tooltip').remove();
			};	
		};
		
		this.reloadTable = function(meta){
			that.scrollBarWidth = getScrollBarWidth(that.element);
			that.previousTableRange = {
				left: -1,
				right: -1,
				top: -1,
				bottom: -1	
			};
			
			if( that.tableWrapper.length ){
				that.realTableHeight = 0;
				that.realTableWidth = 0;
				that.tablePositionY = that.tableWrapper.scrollTop() || 0;
				that.tablePositionX = that.tableWrapper.scrollLeft() || 0;
			}
			$(that.element).empty();
			
			that.meta = meta;
			that.init();
			that.createSpinner();
			that.showSpinner();
			that.data = [];
			that.data.length = 0;
			that.needRebuild = true;
			
			var isItTooBig = that.displayTable();
			that.tablePositionY = 0;
			that.tablePositionX = 0;
			if( !isItTooBig ){
				that.serverEvent = function(eventType, cellList){
					if( typeof that.initialData.event === 'function' ){
						that.initialData.event.call( that, 
							{
								event: eventType,
								source: cellList
							}
						);
					} else {
						that.click = function(cellList){};
					}	
				};
				if( typeof that.initialData.build === 'function' ){
					that.initialData.build.call( that, that, that.tableServerCellRange);
				} else {
					that.hideSpinner();
					that.isDrawing = false;
				}
				
				var timer;
				
				that.tableWrapper.on("mousewheel", function() {
					if( that.isDrawing ){
						return false;
					}
				});
				
				that.tableWrapper.on('scroll', function(e){
					if( that.isDrawing ){
						e.preventDefault();
						return;
					}
					that.showSpinner();
					clearTimeout(timer);
					timer = setTimeout(function() {
						that.stopTab = true;
						that.determinateDisplayedCellsAndRows();
						that.addUnionToTableRange();
						
						
						that.displayTable();
						
						if( $('#lazy-table-fixed-column-container-'+that.tableIdSalt).length ){
							$('#lazy-table-fixed-column-container-'+that.tableIdSalt).css({
								'top': -that.tableWrapper.scrollTop()
							});
						}
						if( $('#lazy-table-fixed-row-container-'+that.tableIdSalt).length ){
							$('#lazy-table-fixed-row-container-'+that.tableIdSalt).css({
								'left': -that.tableWrapper.scrollLeft()
							});
						}
						if( typeof that.initialData.build === 'function' && that.needRebuild ){
							that.initialData.build.call( that, that, that.tableServerCellRange);
						}else {
							that.hideSpinner();
							that.isDrawing = false;
						}						
					}, 10);
				});
				
				that.addEventListeners();
				
			} else {
				that.hurtMe();
			}
			
		};
	}
	
	$.fn.lazyGrid = function( data ) {
		this.lazyGrid = new LazyGrid();
		var that = this;
		this.lazyGrid.element = this;
		
		this.lazyGrid.initialData = data;
		
		this.each(function() {
		      this.lgInstance = that;
		});
		
		return this;
	};
	
	function getScrollBarWidth(element) {
	    var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo(element),
	        widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
	    $outer.remove();
	    return 100 - widthWithScroll;
	}
	
	$(document).ready(function() {
		initLgContextMenu();
		createContextMenu();
	});

})(jQuery);